//
// import {Vec2} from "@benev/toolbox"
//
// import {Assets} from "./assets.js"
// import {Agent} from "../../logic/agent.js"
// import {Selectacon} from "./selectacon.js"
// import {Choice, Incident} from "../../logic/state.js"
// import {Trashbin} from "../../tools/trashbin.js"
// import {isValidSpawnPlace} from "../../logic/routines/aspects/spawning.js"
//
// export class Traversal {
// 	#trashbin = new Trashbin()
// 	#stopListening: () => void
//
// 	constructor(private options: {
// 			agent: Agent
// 			assets: Assets
// 			selectacon: Selectacon
// 			actuate: (incident: Incident.Turn) => void
// 		}) {
// 		this.#stopListening = options.selectacon.selection.on(() => this.render())
// 	}
//
// 	render() {
// 		this.#trashbin.dispose()
//
// 		const {agent, selectacon, assets} = this.options
// 		const selection = selectacon.selection.value
// 		const teamId = agent.state.context.currentTurn
//
// 		if (selection) {
//
// 			// render spawning liberties
// 			if (selection.kind === "roster") {
// 				console.log("select roster")
// 				for (const {place} of agent.tiles.list()) {
// 					if (isValidSpawnPlace(agent, teamId, place)) {
// 						const instance = assets.indicators.liberty()
// 						instance.position.set(...agent.coordinator.toPosition(place))
// 						this.#trashbin.disposable(instance)
// 					}
// 				}
// 			}
//
// 			// // render traversal liberties
// 			// for (const move of findValidMoves(agent, selection.unit)) {
// 			// 	const instance = assets.indicators.liberty()
// 			// 	instance.position.set(...agent.coordinator.toPosition(move))
// 			// 	this.#trashbin.disposable(instance)
// 			// }
//
// 			// // render attack indicators
// 			// for (const attack of findValidAttacks(agent, selection.unit)) {
// 			// 	const instance = assets.indicators.attack()
// 			// 	instance.position.set(...agent.coordinator.toPosition(attack))
// 			// 	this.#trashbin.disposable(instance)
// 			// }
// 		}
// 	}
//
// 	attemptSpawn(choice: Choice.Spawn) {
// 		const {agent, actuate} = this.options
// 		if (isValidSpawnPlace(agent, teamId, choice.place)) {}
// 	}
//
// 	attemptAttack() {}
//
// 	attemptMove(placeA: Vec2, placeB: Vec2) {
// 		console.log("TODO attempt move")
// 		// const {agent, actuate} = this.options
// 		// if (isMovementValid(agent, placeA, placeB)) {
// 		// 	const [unitId] = agent.units.query(placeA)!
// 		// 	actuate({
// 		// 		kind: "action",
// 		// 		name: "move",
// 		// 		unitId,
// 		// 		to: placeB,
// 		// 	})
// 		// 	return true
// 		// }
// 		// else return false
// 	}
//
// 	dispose() {
// 		this.#stopListening()
// 		this.#trashbin.dispose()
// 	}
// }
//