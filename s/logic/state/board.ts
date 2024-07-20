
import {loop2d, Vec2} from "@benev/toolbox"

export type Elevation = 1 | 2 | 3

export type Tile = {
	elevation: Elevation
	step: boolean
}

export type Board = {
	extent: Vec2
	tiles: Tile[]
}

export function makeBoard(): Board {
	const extent: Vec2 = [8, 8]
	const tiles = [...loop2d(extent)].map((): Tile => ({
		step: false,
		elevation: 1,
	}))
	return {extent, tiles}
}
