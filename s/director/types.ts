
import {Remote} from "renraku"
import {Game} from "./parts/game.js"
import {Clientside} from "./apis/clientside.js"

export type WorldStats = {
	games: number
	players: number
	gamesInLastHour: number
}

export type PersonStatus = (
	| "chilling"
	| "queued"
	| "gaming"
)

export type RegularReport = {
	worldStats: WorldStats
	personStatus: PersonStatus
}

export type PersonId = number

export type Person = {
	id: PersonId
	clientside: Remote<Clientside>
	closeConnection: () => void
}

export type Couple = [Person, Person]

/** one gamer's perspective on an ongoing game */
export type GamerSession = {
	game: Game
	person: Person
	teamId: number
}

