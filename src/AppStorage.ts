import { Game, newGame } from "./AppState"

const localStorageKey = "__GameScore__"

export class AppStorage {
	get() {
		try {
			const item = localStorage.getItem(localStorageKey)
			if (item) {
				const oldGame = JSON.parse(item)
				if (oldGame) {
					return oldGame as Game
				}
			}
		} catch (error) {}
		return newGame()
	}
	set(game: Game) {
		localStorage.setItem(localStorageKey, JSON.stringify(game))
	}
}
