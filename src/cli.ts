//
// ./node_modules/.bin/ts-node src/test/cli.ts
//

import * as readline from "readline"
import { Triplestore } from "triple-database"
import { evaluate } from "./repl"

async function main() {
	const db = new Triplestore()

	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	})

	async function read() {
		return new Promise<string>((resolve) => rl.question("> ", resolve))
	}

	while (true) {
		const input = await read()
		const result = evaluate(db, input)
		if (result === undefined) continue
		console.log(result)
	}
}

if (require.main === module) {
	console.log("Starting Triplestore REPL...")
	console.log("Type 'help' for commands.")
	main()
}
