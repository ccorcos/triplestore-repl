import * as p from "parsimmon"
import { Triplestore } from "triple-database"
import { Expression, OrExpression, Sort } from "triple-database/database/query"
import { ScanIndexArgs } from "triple-database/database/scanIndex"
import { MAX, MIN } from "tuple-database/storage/types"

function between(left: string, right: string) {
	return p.custom<string>(function (success, failure) {
		return function (input, i) {
			if (input[i] !== left) return failure(i, `Does not start with '${left}'.`)
			let j = i + 1
			while (j < input.length) {
				if (input[j] === "\\" && input[j + 1] === right) {
					j += 2
				} else if (input[j] === right) {
					return success(j + 1, input.slice(i + 1, j).replace(/\\"/g, '"'))
				} else {
					j += 1
				}
			}
			return failure(i, `Could night find ${right}.`)
		}
	})
}

export const pString = p.alt(
	p.regex(/[a-zA-Z][a-zA-Z0-9_\-]*/),
	between('"', '"')
)

export const pNumber = p.regex(/\-?[0-9\.e]+/).chain((str) => {
	const n = parseFloat(str)
	if (isNaN(n)) return p.fail("Not a number")
	else return p.succeed(n)
})

type Value = number | string
export const pValue = p.alt<Value>(pNumber, pString)

class Variable {
	constructor(public name: string) {}
}

export const pVar = p
	.regex(/\?[a-zA-Z][a-zA-Z0-9_-]*/)
	.map((str) => new Variable(str.slice(1)))

const pTriple = <T>(parser: p.Parser<T>): p.Parser<[T, T, T]> => {
	return parser.chain((a) =>
		p.whitespace
			.then(parser)
			.chain((b) => p.whitespace.then(parser).map((c) => [a, b, c]))
	)
}

const pFact = pTriple(pValue)

export const pSet = p
	.string("set")
	.then(p.whitespace)
	.then(p.sepBy1(pFact, p.string(",").then(p.whitespace)))

export const pRemove = p
	.string("remove")
	.then(p.whitespace)
	.then(p.sepBy1(pFact, p.string(",").then(p.whitespace)))

const pExpression = pTriple(p.alt<Value | Variable>(pVar, pValue))
const pAndExpression = p.sepBy1(pExpression, p.string(",").then(p.whitespace))
const pOrExpression = p.sepBy1(pAndExpression, p.string(";").then(p.whitespace))

export const pFilter = p
	.string("filter")
	.then(p.whitespace)
	.then(pOrExpression)
	.map((parsedFilter) =>
		parsedFilter.map((andExpr) =>
			andExpr.map((expr) => {
				return expr.map((item) =>
					item instanceof Variable ? { var: item.name } : { value: item }
				) as Expression
			})
		)
	)

export const pSort = p
	.string("sort")
	.then(p.whitespace)
	.then(
		p
			.sepBy1(pVar, p.whitespace)
			.map((sort) => sort.map((item) => ({ var: item.name })))
	)

export const pIndex = p
	.string("index")
	.then(p.whitespace)
	.then(pString)
	.skip(p.whitespace)
	.chain((indexName) =>
		p.sepBy1(pVar, p.whitespace).map((sort) => ({
			name: indexName,
			sort: sort.map((item) => ({ var: item.name })),
		}))
	)

const pPipe = p.whitespace.then(p.string("|")).then(p.whitespace)

type QueryArgs = {
	filter: OrExpression
	name?: string
	sort?: Sort
}

export const pQuery = pFilter.chain<QueryArgs>((filter) => {
	return p.alt(
		pPipe.then(pSort).map((sort) => ({ filter, sort })),
		pPipe.then(pIndex).map(({ name, sort }) => ({ filter, name, sort })),
		p.succeed({ filter })
	)
})

const pTuple = p.sepBy1(pValue, p.whitespace).map((tuple) =>
	tuple.map((item) => {
		if (item === "MAX") return MAX
		if (item === "MIN") return MIN
		return item
	})
)

const bounds = {
	">": "gt",
	">=": "gte",
	"<": "lt",
	"<=": "lte",
	"=": "prefix",
} as const

const pBound = p.alt<
	Partial<{
		gt: Value[]
		gte: Value[]
		lt: Value[]
		lte: Value[]
		prefix: Value[]
		reverse: boolean
		limit: number
	}>
>(
	p.string("-").map(() => ({ reverse: true })),
	p
		.string("!")
		.then(pNumber)
		.map((limit) => ({ limit })),
	...Object.entries(bounds).map(([key, value]) => {
		return p
			.string(key)
			.then(p.optWhitespace)
			.then(pTuple)
			.map((tuple) => ({ [value]: tuple }))
	})
)

export const pScan = p
	.string("scan")
	.then(p.whitespace)
	.then(pString)
	.skip(p.optWhitespace)
	.chain<ScanIndexArgs>((indexName) => {
		return p
			.sepBy(pBound, p.whitespace)
			.map((result) =>
				result.reduce((a, b) => ({ ...a, ...b }), { index: indexName })
			)
	})

export function evaluate(db: Triplestore, input: string) {
	const program = p.alt(
		pSet.map((triples) => {
			const tx = db.transact()
			triples.forEach((triple) => tx.set(triple))
			tx.commit()
			return `added ${triples.length} facts`
		}),
		pRemove.map((triples) => {
			const tx = db.transact()
			triples.forEach((triple) => tx.remove(triple))
			tx.commit()
			return `removed ${triples.length} facts`
		}),
		pQuery.map((args) => {
			const { name, sort, filter } = args
			if (name && sort) {
				db.ensureIndex({ name, sort, filter })
				return `created index ${name}`
			} else if (sort) {
				return db.querySort({ filter, sort })
			} else {
				return db.query({ filter })
			}
		}),
		pScan.map((args) => {
			return db.scanIndex(args)
		})
	)

	const str = input.trim()
	if (str === "" || str.startsWith("#")) {
		// Allow empty lines and comments.
		return undefined
	}
	if (str === "help") {
		return `
Add facts with the 'set' command:
	set chet age 30

Add multiple facts using a comma:
	set chet color blue, chet wife meghan, meghan color red

Remove facts with 'remove' command (and multiple with a comma):
	remove chet age 30

Filter facts with the 'filter' command:
	(get all facts)
	filter ?e ?a ?v

	(get all people who's color is blue)
	filter ?person color blue

	(get all people and their colors)
	filter ?person color ?color

Filters can have compound AND clauses using a comma:
  (friends who's color is blue)
  filter ?person friend ?friend, ?friend color blue

Filters can have compound OR clauses using a semi-colon.
  (friends whos color is blue or red)
  filter ?person friend ?friend, ?friend color blue; ?person friend ?friend, ?friend color red

Sort the output a query by piping to 'sort':
  (all people and their colors ordered by color first)
	filter ?person color ?color | sort ?color ?person

Or create an index for performant reads:
  (this index will be updated when new facts are added)
	filter ?person color ?color | index personByColor ?color ?person

Then you can scan the index:
  (=tuple filters for a prefix)
	scan personByColor =blue

	(>tuple will filter for greater than, >=, <, <= also available)
	scan personByColor >blue chet

	(- means reverse order, !n means limit n)
	scan personByColor - !2
		`.trim()
	}
	const result = program.parse(str)
	if (!result.status) {
		return "Failed to parse."
	} else {
		return result.value
	}
}
