import React from "react"
import ReactDOM from "react-dom"
import { Triplestore } from "triple-database"
import { App } from "./components/App"
import "./index.css"

const db = new Triplestore()

// Render the app.
const root = document.createElement("div")
document.body.appendChild(root)

ReactDOM.render(<App db={db} />, root)
