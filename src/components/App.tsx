import React, { useCallback, useState } from "react"
import { Triplestore } from "triple-database"

type Command = [string, string]

export function App(props: { db: Triplestore }) {
	const [commands, setCommands] = useState<Command[]>([])

	const [value, setValue] = useState("")
	const handleChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			setValue(event.target.value)
		},
		[]
	)

	return (
		<div
			style={{
				maxWidth: "100%",
				width: "24em",
				margin: "0 auto",
			}}
		>
			<h2>Triplestore REPL</h2>
			<input value={value} onChange={handleChange} />
		</div>
	)
}
