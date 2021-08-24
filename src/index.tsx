import React from "react"
import ReactDOM from "react-dom"
import { AppState } from "./AppState"
import { AppStorage } from "./AppStorage"
import { App } from "./components/App"
import { Environment, EnvironmentProvider } from "./Environment"
import "./index.css"

// Build the environment.
const storage = new AppStorage()
const initialState = storage.get()

const app = new AppState(initialState)
app.addListener(() => storage.set(app.state))

const environment: Environment = { app }

// For debugging from the Console.
;(window as any)["environment"] = environment
Object.assign(window as any, environment)

// Render the app.
const root = document.createElement("div")
document.body.appendChild(root)

ReactDOM.render(
	<EnvironmentProvider value={environment}>
		<App />
	</EnvironmentProvider>,
	root
)
