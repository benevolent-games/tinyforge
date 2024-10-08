
import {loop} from "@benev/toolbox"
import {Map2} from "../../../tools/map2.js"
import {Glb, Instancer} from "../utils/glb.js"
import {Elevation, TeamId} from "../../../logic/state.js"

type Alt = "odd" | "even"
type TileType = "block" | "step"

export class BoardGlb extends Glb {
	border = this.instancer(`border8x8`)

	tile = (() => {
		const elevations: Elevation[] = [1, 2, 3]
		const alts: Alt[] = ["odd", "even"]
		const types: TileType[] = ["block", "step"]

		const map = new Map2<string, Instancer>()
		const name = (type: TileType, elevation: Elevation, alt: Alt) => `${type}${elevation}-${alt}`

		for (const type of types) {
			for (const elevation of elevations) {
				for (const alt of alts) {
					const n = name(type, elevation, alt)
					map.set(n, this.instancer(n))
				}
			}
		}

		return {
			block: (elevation: Elevation, alt: Alt) => {
				return map.require(name("block", elevation, alt))()
			},
			step: (elevation: Elevation, alt: Alt) => {
				return map.require(name("step", elevation, alt))()
			},
		}
	})()

	obstacle = (() => {
		const map = new Map2<number, Instancer>()

		for (const i of loop(12)) {
			const hp = i + 1
			map.set(hp, this.instancer(`obstacle${hp}`))
		}

		return (healthVariant: number) => map.require(healthVariant)()
	})()

	roster = (() => {
		const map = new Map2<number, Instancer>()
		map.set(0, this.instancer(`team1-roster`))
		map.set(1, this.instancer(`team2-roster`))
		return (teamId: number) => map.require(teamId)()
	})()
}

