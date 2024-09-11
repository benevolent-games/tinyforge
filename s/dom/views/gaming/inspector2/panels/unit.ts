
import {html} from "@benev/slate"
import {Bridge} from "../../../../utils/bridge.js"
import {capitalize} from "../../../../../tools/capitalize.js"
import {archetypeDisplay} from "../utils/archetype-display.js"

export function unitPanel(bridge: Bridge) {
	const agent = bridge.agent.value
	const selection = bridge.selectaconSelection.value

	if (selection?.kind !== "tile")
		return null

	const unit = agent.units.at(selection.place)
	if (!unit)
		return null

	const archetype = agent.archetype(unit.kind)
	const arcdisplay = archetypeDisplay(archetype)

	const team = (unit.team === null)
		? "null"
		: unit.team + 1

	return html`
		<section class=panel>
			<h1 class="unitkind" data-team="${team}">
				${capitalize(unit.kind)}
			</h1>
			${arcdisplay.sentence}
			<div class=group>
				${arcdisplay.sections}
			</div>
		</section>
	`
}

