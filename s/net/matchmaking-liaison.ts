
import {Connectivity} from "./connectivity.js"
import {Op, opSignal, reactor, Trashbin} from "@benev/slate"

export namespace MatchmakingSituation {
	export type Disconnected = {
		kind: "disconnected"
	}

	export type Unqueued = {
		kind: "unqueued"
		startMatchmaking: () => Promise<void>
	}

	export type Queued = {
		kind: "queued"
		cancelMatchmaking: () => Promise<void>
	}

	export type Any = Disconnected | Unqueued | Queued
}

export class MatchmakingLiaison {
	#trashbin = new Trashbin()

	state = opSignal<"unqueued" | "queued">()
	situation = opSignal<MatchmakingSituation.Any>()

	constructor(public connectivity: Connectivity) {
		const {disposer: dr} = this.#trashbin

		this.state.setReady("unqueued")
		dr(connectivity.onConnected(() => this.state.setReady("unqueued")))
		dr(connectivity.onDisconnected(() => this.state.setReady("unqueued")))

		dr(reactor.reaction(() => {
			this.situation.value = (() => {
				const connection = this.connectivity.connection.payload

				if (!connection)
					return Op.ready({kind: "disconnected"})

				return Op.morph(this.state.value, (state): MatchmakingSituation.Any => {
					return (state === "queued")
						? {kind: "queued", cancelMatchmaking: async() => this.#cancelMatchmaking()}
						: {kind: "unqueued", startMatchmaking: async() => this.#startMatchmaking()}
				})
			})()
		}))
	}

	async bail() {
		const situation = this.situation.payload
		if (situation && situation.kind === "queued")
			await situation.cancelMatchmaking()
	}

	dispose() {
		this.#trashbin.dispose()
	}

	#requirements() {
		const {connectivity} = this
		const connection = connectivity.connection.payload
		if (!connection)
			throw new Error("not connected")
		return {connection, connectivity}
	}

	#getCurrentState() {
		return (
			this.connectivity.connection.payload?.report.personStatus === "queued"
				? "queued"
				: "unqueued"
		)
	}

	async #startMatchmaking() {
		const {connection, connectivity} = this.#requirements()
		await this.state.load(async() => {
			await connection.serverside.matchmaking.joinQueue()
			await connectivity.queryReport()
			return this.#getCurrentState()
		})
	}

	async #cancelMatchmaking() {
		const {connection, connectivity} = this.#requirements()
		await this.state.load(async() => {
			await connection.serverside.matchmaking.leaveQueue()
			await connectivity.queryReport()
			return this.#getCurrentState()
		})
	}
}

