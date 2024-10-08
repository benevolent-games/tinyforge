
import {Vec2, Vec3} from "@benev/toolbox"
import {ref, Trashbin} from "@benev/slate"

import {Tiler} from "./tiler.js"
import {World} from "./world.js"
import {Pointing} from "./types.js"
import {Rosters} from "./rosters.js"
import {Agent} from "../../logic/agent.js"
import {Assets} from "../assets/assets.js"
import {UnitKind} from "../../config/units.js"
import {TurnTracker} from "../../logic/simulation/aspects/turn-tracker.js"

export type TileCell = {
	kind: "tile"
	place: Vec2
	position: Vec3
}

export type RosterCell = {
	kind: "roster"
	position: Vec3
	unitKind: UnitKind
	teamId: number
}

export type Cell = TileCell | RosterCell

export class Selectacon {
	hover = ref<Cell | null>(null, {dedupe: true})
	selection = ref<Cell | null>(null, {dedupe: true})

	#bin = new Trashbin()

	constructor(private options: {
			agent: Agent
			assets: Assets
			tiler: Tiler
			rosters: Rosters
			world: World
			turnTracker: TurnTracker
		}) {

		this.hover.on(() => this.render())
		this.selection.on(() => this.render())
	}

	performHover(p: Pointing | null) {
		this.hover.value = p ? this.pick(p) : null
	}

	#renderHover() {
		this.#bin.dispose()

		const {assets, turnTracker} = this.options
		const d = this.#bin.disposable
		const cell = this.hover.value

		if (cell) {
			const teamId = turnTracker.ourTurn
				? turnTracker.teamId
				: null
			const instance = d(assets.indicators.hover(teamId))
			instance.position.set(...cell.position)
		}
	}

	#renderSelection() {
		const {assets} = this.options
		const d = this.#bin.disposable
		const cell = this.selection.value

		if (cell) {
			const instance = d(assets.indicators.selection())
			instance.position.set(...cell.position)
		}
	}

	render() {
		this.#bin.dispose()
		this.#renderHover()
		this.#renderSelection()
	}

	pick(event: Pointing): Cell | null {
		const {agent, world, tiler, rosters} = this.options

		const {pickedMesh} = world.scene.pick(
			event.clientX,
			event.clientY,
			mesh => (
				tiler.placements.has(mesh) ||
				rosters.placements.has(mesh)
			),
		)

		if (pickedMesh) {
			const tilePlacement = tiler.placements.get(pickedMesh)
			const rosterPlacement = rosters.placements.get(pickedMesh)

			if (tilePlacement) {
				const {place} = tilePlacement
				return {
					kind: "tile",
					place,
					position: agent.coordinator.toPosition(place),
				}
			}
			else if (rosterPlacement) {
				const {teamId, position, unitKind} = rosterPlacement
				return {
					kind: "roster",
					teamId,
					position,
					unitKind,
				}
			}
		}

		return null
	}

	dispose() {
		this.hover.dispose()
		this.selection.dispose()
		this.#bin.dispose()
	}
}

