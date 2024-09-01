
import {Game} from "./game.js"
import {People} from "./people.js"
import {GamesStats} from "./games-stats.js"
import {IdMappable2} from "../../tools/map2.js"
import {IdCounter} from "../../tools/id-counter.js"
import {Couple, GamerSession, Person} from "../types.js"

export class Games extends IdMappable2<number, Game> {
	stats = new GamesStats()
	#ids = new IdCounter()

	constructor(public people: People) {
		super()
	}

	newGame(couple: Couple) {
		const id = this.#ids.next()
		const game = new Game(id, couple)
		this.map.add(game)
		this.stats.countNewGame()
		return game
	}

	requireSession(person: Person): GamerSession {
		for (const game of this.values()) {
			const couplet = game.couple.map((person, teamId) => ({person, teamId}))
			for (const info of couplet) {
				if (info.person === person)
					return {person, game, teamId: info.teamId}
			}
		}
		throw new Error(`session not found for person id ${person.id}`)
	}

	findGameWithPerson(person: Person) {
		for (const game of this.values()) {
			if (game.couple.some(p => p === person))
				return game
		}
		return undefined
	}

	async endGame(game: Game) {
		game.dispose()
		this.map.remove(game)
		await Promise.all(
			game.couple
				.filter(person => this.people.got(person))
				.map(person => person.clientside.game.end())
		)
	}
}
