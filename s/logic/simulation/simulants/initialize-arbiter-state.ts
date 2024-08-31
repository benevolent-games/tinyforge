
import {deep} from "@benev/slate"
import {ArbiterState, FullTeamInfo, GameInitial} from "../../state.js"

/** establish the authoritative state for the game */
export function initializeArbiterState(initial: GameInitial): ArbiterState {
	return deep.clone({
		initial,
		units: initial.units,
		context: {
			turnCount: 0,
			nextId: initial.id,
			conclusion: null,
		},
		teams: initial.config.teams.map((team): FullTeamInfo => ({
			name: team.name,
			resources: initial.config.startingResources,
		})),
		investments: [],
		reminders: {
			choices: [],
			kills: [],
		},
	})
}

