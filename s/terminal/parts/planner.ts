
import {Vec2} from "@benev/toolbox"
import {Trashbin} from "@benev/slate"
import {TransformNode} from "@babylonjs/core"

import {Assets} from "./assets.js"
import {Selectacon} from "./selectacon.js"
import {Agent} from "../../logic/agent.js"
import {Choice} from "../../logic/state.js"
import {SubmitTurnFn} from "../../logic/arbiter.js"
import {Proposer} from "../../logic/simulation/proposer.js"

/** interface for the user to sketch a plan for their turn */
export class Planner {
	#planbin = new Trashbin()
	#renderbin = new Trashbin()

	proposer: Proposer
	choices: Choice.Any[] = []

	constructor(private options: {
			agent: Agent
			assets: Assets
			selectacon: Selectacon
			submitTurn: SubmitTurnFn
		}) {

		this.proposer = new Proposer(options.agent)

		this.#planbin.disposer(
			options.selectacon.selection.on(() => this.render())
		)
	}

	reset() {
		this.proposer = new Proposer(this.options.agent)
		this.choices = []
	}

	#spawn(fn: () => TransformNode, place: Vec2) {
		const {agent} = this.options
		const instance = fn()
		const position = agent.coordinator.toPosition(place)
		instance.position.set(...position)
		this.#renderbin.disposable(instance)
		return instance
	}

	render() {
		this.#renderbin.dispose()
		const {proposer} = this
		const {agent, selectacon, assets} = this.options
		const selection = selectacon.selection.value

		if (selection) {

			// render spawning liberties
			if (selection.kind === "roster" && selection.teamId === agent.currentTurn)
				Array
					.from(agent.tiles.list())
					.filter(({place}) => !!proposer.choosers.spawn({
						kind: "spawn",
						place,
						unitKind: selection.unitKind,
					}))
					.forEach(({place}) => {
						this.#spawn(assets.indicators.liberty, place)
					})

			// render movement liberties
			if (selection.kind === "tile")
				Array
					.from(agent.tiles.list())
					.filter(({place}) => !!proposer.choosers.movement({
						kind: "movement",
						source: selection.place,
						target: place,
					}))
					.forEach(({place}) => {
						this.#spawn(assets.indicators.liberty, place)
					})
		}
	}

	attempt(choice: Choice.Any) {
		const {agent} = this.options
		if (agent.conclusion)
			return false
		const fn = this.proposer.choosers[choice.kind] as any
		const report = fn(choice)
		if (report) {
			this.choices.push(choice)
			report.commit()
			return true
		}
		return false
	}

	executePlan() {
		this.options.submitTurn({choices: this.choices})
		this.reset()
	}

	dispose() {
		this.#renderbin.dispose()
		this.#planbin.dispose()
	}
}

