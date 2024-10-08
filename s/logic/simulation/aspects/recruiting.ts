
import {Vec2} from "@benev/toolbox"

import {Agent} from "../../agent.js"
import {isWithinRange} from "./navigation.js"
import {isVerticallyCompatible} from "./verticality.js"

export function isValidRecruitmentPlace(agent: Agent, teamId: number, place: Vec2) {
	const tile = agent.tiles.at(place)
	const occupied = agent.units.at(place)

	if (occupied)
		return false

	for (const unit of agent.units.list()) {
		const {recruiter} = agent.archetype(unit.kind)
		const unitTile = agent.tiles.at(unit.place)
		const valid = (
			unit.team === teamId &&
			recruiter &&
			isWithinRange(recruiter.range, unit.place, place) &&
			isVerticallyCompatible(recruiter.verticality, unitTile, tile)
		)
		if (valid)
			return true
	}

	return false
}

