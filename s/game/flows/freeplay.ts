
import {ev} from "@benev/slate"
import {make_envmap, scalar} from "@benev/toolbox"
import {DirectionalLight, Vector3} from "@babylonjs/core"

import {World} from "../world/world.js"
import {Board} from "../board/board.js"
import {Stuff} from "../../tools/stuff.js"
import {Orbitcam} from "../orbitcam/orbitcam.js"
import {Bishop, Grid, King, Knight, Pawn, Place, Placements, Queen, Rook} from "../concepts.js"

const {degrees} = scalar.radians.from

export async function freeplayFlow() {

	const world = await World.load()
	const {scene} = world

	const glb = await world.loadGlb("/assets/nightchess.glb")
	const envmap = make_envmap(scene, "/assets/studiolights.env")
	scene.environmentIntensity = 0.1

	const stuff = new Stuff(glb)

	console.log("props", [...stuff.props.values()].map(m => m.name))
	console.log("meshes", [...stuff.meshes.values()].map(m => m.name))

	stuff.instanceProp("border8x8")
	const grid = new Grid()
	const placements = new Placements()
	const board = new Board({
		grid,
		placements,
		blocks: {
			size: 2,
			height: 1,
			instancers: [
				() => stuff.instanceProp("grid-floor-bottom"),
				() => stuff.instanceProp("grid-floor-middle"),
				() => stuff.instanceProp("grid-floor-top"),
			],
		},
		unitInstancers: (new Map()
			.set(King, () => stuff.instanceProp("pawn"))
			.set(Queen, () => stuff.instanceProp("pawn"))
			.set(Bishop, () => stuff.instanceProp("pawn"))
			.set(Knight, () => stuff.instanceProp("pawn"))
			.set(Rook, () => stuff.instanceProp("pawn"))
			.set(Pawn, () => stuff.instanceProp("pawn"))
		),
	})

	grid.at(new Place([2, 2])).elevation = 1
	grid.at(new Place([2, 3])).elevation = 1
	grid.at(new Place([3, 2])).elevation = 1
	grid.at(new Place([3, 3])).elevation = 2
	placements.put(new Pawn(), new Place([3, 3]))

	board.render()

	const orbitcam = new Orbitcam({
		scene,
		smoothing: 3,
		sensitivity: 5 / 1000,
		zoomSpline: [30, 30, 20, 5],
		verticalRange: [degrees(0), degrees(60)],
	})
	world.rendering.setCamera(orbitcam.camera)
	const unbindOrbitControls = ev(world.canvas, orbitcam.events)
	const stopOrbitTick = world.gameloop.on(orbitcam.tick)

	const sun = new DirectionalLight(
		"sun",
		new Vector3(.123, -1, .234).normalize(),
		scene,
	)

	sun.intensity = .2
	world.gameloop.start()

	return {
		world,
		orbitcam,
		sun,
		dispose: () => {
			envmap.dispose()
			world.dispose()
			stopOrbitTick()
			unbindOrbitControls()
			orbitcam.dispose()
		},
	}
}

