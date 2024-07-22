
import {vec2, Vec2} from "@benev/toolbox"
import {UnitsHelper} from "./units.js"
import {UnitsState} from "../state/units.js"
import {mintId} from "../../tools/mint-id.js"
import {Claim, ClaimsState} from "../state/claims.js"

export class ClaimsHelper {
	constructor(public state: ClaimsState) {}

	get(id: string) {
		for (const [claimId, claim] of this.state)
			if (claimId === id)
				return claim
		throw new Error(`claim ${id} not found`)
	}

	at(place: Vec2) {
		return this.state.filter(([,claim]) => vec2.equal(claim.place, place))
	}

	getStakeholder(id: string, units: UnitsState) {
		const claim = this.get(id)
		return new UnitsHelper(units).at(claim.place)
	}

	create(claim: Claim.Any) {
		const id = mintId()
		this.state.push([id, claim])
		return id
	}
}
