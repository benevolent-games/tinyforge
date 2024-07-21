
import {Vec2} from "@benev/toolbox"
import {ChessGlb} from "../../chess-glb.js"
import {Board} from "../../../logic/state/board.js"
import {coordinator} from "../../../logic/helpers/coordinator.js"

export function makeHoverRenderer(chessGlb: ChessGlb) {
	let wipe = () => {}

	function hover(board: Board, teamId: number, place: Vec2 | undefined) {
		wipe()
		if (place) {
			const position = coordinator(board).toPosition(place)
			const instance = chessGlb.indicatorHover(teamId)
			instance.position.set(...position)
			wipe = () => instance.dispose()
		}
	}

	return {
		hover,
		dispose: wipe,
	}
}
