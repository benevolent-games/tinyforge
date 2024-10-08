
import {Trashbin} from "@benev/slate"
import {TransformNode} from "@babylonjs/core"
import {babyloid, Prop, Vec2} from "@benev/toolbox"

import {World} from "./world.js"
import {Agent} from "../../logic/agent.js"
import {Assets} from "../assets/assets.js"
import {Elevation, Tile} from "../../logic/state.js"

export type TilePlacement = {
	place: Vec2
}

export class Tiler {
	#trashbin = new Trashbin()
	placements = new Map<Prop, TilePlacement>()

	constructor(private options: {
		agent: Agent
		world: World
		assets: Assets
	}) {}

	render() {
		const trashbin = this.#trashbin
		const placements = this.placements
		const {agent, assets} = this.options

		this.dispose()

		function oddOrEven([x, y]: Vec2) {
			return ((x + y) % 2) === 0
				? "odd"
				: "even"
		}

		function positionBlock(instance: TransformNode, place: Vec2, elevation: number) {
			// subtracting one because blocks are rooted at their bottom,
			// whereas the elevation height tells us the world height of the top
			const y = agent.coordinator.elevationHeight(elevation - 1)
			const [x,,z] = agent.coordinator.toBlockPosition(place)
			instance.position.set(x, y, z)
		}

		function saveBlockPlacement(instance: Prop, place: Vec2) {
			for (const mesh of [instance, ...instance.getChildMeshes()])
				if (babyloid.is.meshoid(mesh))
					placements.set(mesh, {place})
		}

		function spawnBlock(place: Vec2, elevation: Elevation) {
			const instance = trashbin.disposable(
				assets.board.tile.block(elevation, oddOrEven(place))
			)
			positionBlock(instance, place, elevation)
			saveBlockPlacement(instance, place)
			return instance
		}

		function spawnStep(place: Vec2, elevation: Elevation) {
			const instance = trashbin.disposable(
				assets.board.tile.step(elevation, oddOrEven(place))
			)
			positionBlock(instance, place, elevation + 1)
			saveBlockPlacement(instance, place)
			return instance
		}

		function renderTile(tile: Tile, place: Vec2) {
			if (tile.elevation < 1)
				return null

			if (tile.step) {
				spawnBlock(place, tile.elevation)
				spawnStep(place, tile.elevation)
			}
			else {
				spawnBlock(place, tile.elevation)
			}

			// spawn blocks underneath
			if (tile.elevation > 1)
				spawnBlock(place, 1)

			if (tile.elevation > 2)
				spawnBlock(place, 2)
		}

		for (const {tile, place} of agent.tiles.list())
			renderTile(tile, place)
	}

	dispose() {
		this.#trashbin.dispose()
		this.placements.clear()
	}
}

