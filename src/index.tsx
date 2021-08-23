import React from "react"
import ReactDOM from "react-dom"
import { AppState, newGame } from "./AppState"
import { App } from "./components/App"
import { Environment, EnvironmentProvider } from "./Environment"
import "./index.css"

// Build the environment.
let initialGame = newGame()
try {
	const item = localStorage.getItem("__GameScore__")
	if (item) {
		const oldGame = JSON.parse(item)
		if (oldGame) {
			initialGame = oldGame
		}
	}
} catch (error) {}

const app = new AppState(initialGame)
app.addListener(() => {
	localStorage.setItem("state3", JSON.stringify(app.state))
})

const environment: Environment = { app }

// Render the app.
const root = document.createElement("div")
document.body.appendChild(root)

ReactDOM.render(
	<EnvironmentProvider value={environment}>
		<App />
	</EnvironmentProvider>,
	root
)

// For debugging from the Console.
;(window as any)["environment"] = environment
Object.assign(window as any, environment)
