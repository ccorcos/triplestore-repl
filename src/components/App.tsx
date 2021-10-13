import inspect from "browser-util-inspect"
import React, { useCallback, useEffect, useState } from "react"
import { Triplestore, Tuple } from "triple-database"
import { Binding } from "triple-database/database/query"
import { useRefCurrent } from "../hooks/useRefCurrent"
import { evaluate } from "../repl"

type Command = [string, string | Tuple[] | Binding[] | undefined]

export function REPL(props: { db: Triplestore }) {
	const { db } = props
	const [commands, setCommands] = useState<Command[]>([])

	const [value, setValue] = useState("")

	const handleChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			setValue(event.target.value)
		},
		[]
	)

	const inputRef = useRefCurrent(value)
	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLInputElement>) => {
			if (event.key === "Enter") {
				const input = inputRef.current
				setValue("")
				const result = evaluate(db, input)
				setCommands((list) => [...list, [input, result]])
			}
		},
		[]
	)

	return (
		<div style={{ maxWidth: "100%", width: "45em" }}>
			<h2>Triplestore REPL</h2>
			{commands.map((command, i) => {
				return (
					<div key={i} style={{ marginBottom: "1em" }}>
						<div style={{ marginBottom: "0.25em" }}>{"> " + command[0]}</div>
						<div style={{ color: "gray", whiteSpace: "pre" }}>
							{pretty(command[1])}
						</div>
					</div>
				)
			})}
			<div style={{ width: "100%", position: "relative" }}>
				<div
					style={{
						position: "absolute",
						top: -2,
						left: 8,
						height: "100%",
						display: "flex",
						alignItems: "center",
					}}
				>
					{">"}
				</div>
				<input
					id="repl"
					placeholder="help"
					value={value}
					onChange={handleChange}
					onKeyDown={handleKeyDown}
					style={{
						width: "100%",
						paddingLeft: "1.25em",
						boxSizing: "border-box",
					}}
				/>
			</div>
		</div>
	)
}

function Data(props: { db: Triplestore }) {
	const { db } = props
	const [data, setState] = useState(db.storage.scan())
	useEffect(() => {
		return db.storage.subscribe({}, () => {
			setState(db.storage.scan())
		})
	}, [])

	return (
		<div style={{ maxWidth: "100%", width: "45em" }}>
			<h2>Ordered Key-Value Storage</h2>
			<div style={{ whiteSpace: "pre" }}>
				{pretty(data.map(([tuple]) => tuple))}
			</div>
		</div>
	)
}

export function App(props: { db: Triplestore }) {
	return (
		<div
			style={{
				display: "flex",
				justifyContent: "center",
			}}
		>
			<div style={{ overflow: "auto", marginRight: "2em" }}>
				<REPL db={props.db} />
			</div>
			<div style={{ overflow: "auto" }}>
				<Data db={props.db} />
			</div>
		</div>
	)
}

function pretty(
	arg: string | number | boolean | any[] | object | undefined
	// depth = 0
) {
	// if (arg === undefined) return "undefined"
	// if (typeof arg === "string") return arg
	// if (typeof arg === "number") return arg
	// if (typeof arg === "boolean") return arg.toString()
	// if (Array.isArray(arg)) {
	// 	return (
	// 		"[ " +
	// 		arg.map((arg) => pretty(arg, depth + 1)).join(depth < 1 ? "\n" : ", ") +
	// 		" ]"
	// 	)
	// }

	return inspect(arg)
}

/*

Demo:

set chet color blue, meghan color red, sean color green, andrew color blue
filter ?person color ?color

*/
