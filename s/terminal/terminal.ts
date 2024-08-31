
import {Trashbin} from "@benev/slate"

import {Turn} from "../logic/state.js"
import {Tiler} from "./parts/tiler.js"
import {Agent} from "../logic/agent.js"
import {Rosters} from "./parts/rosters.js"
import {Hovering} from "./parts/hovering.js"
import {Planner} from "./planner/planner.js"
import {Claimery} from "./parts/claimery.js"
import {CameraRig} from "./parts/camera-rig.js"
import {Selectacon} from "./parts/selectacon.js"
import {UserInputs} from "./parts/user-inputs.js"
import {makeBasicVisuals} from "./parts/basics.js"
import {UnitVisuals} from "./parts/unit-visuals.js"
import {setupPreviewAgent} from "./parts/preview-agent.js"
import {TurnTracker} from "../logic/simulation/aspects/turn-tracker.js"

export async function makeGameTerminal(

		// actual state from the arbiter
		baseAgent: Agent,

		// tracking which team we can play as
		turnTracker: TurnTracker,

		// submit the player's turn to the arbiter
		submitTurn: (turn: Turn) => void,
	) {

	const trashbin = new Trashbin()
	const d = trashbin.disposable
	const dr = trashbin.disposer
	const {dispose} = trashbin

	const {agent, reset: resetPreview} = d(
		setupPreviewAgent(baseAgent, () => planner.reset())
	)

	const {world, assets} = d(await makeBasicVisuals())
	d(assets.board.border())
	const cameraRig = d(new CameraRig({world}))
	const tiler = d(new Tiler({agent, world, assets}))
	const rosters = d(new Rosters({agent, world, assets}))
	const selectacon = d(new Selectacon({agent, world, assets, tiler, rosters}))
	const unitVisuals = d(new UnitVisuals(agent, assets))
	const claimery = d(new Claimery({agent, assets}))

	const planner = d(new Planner({agent, assets, selectacon, turnTracker, submitTurn}))
	d(new Hovering({world, selectacon}))
	d(new UserInputs({agent, world, planner, selectacon, cameraRig, turnTracker, resetPreview}))

	dr(selectacon.selection.on(() => planner.render()))

	function render() {
		rosters.render()
		selectacon.render()
		unitVisuals.render()
		planner.render()
		claimery.render()
	}

	tiler.render()
	render()
	world.gameloop.start()
	dr(agent.stateRef.on(render))

	return {world, render, dispose}
}

