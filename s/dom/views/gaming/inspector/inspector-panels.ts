
import {loop} from "@benev/toolbox"
import {html, is} from "@benev/slate"

import {Agent} from "../../../../logic/agent.js"
import {unitEssays} from "../../../../logic/essays.js"
import {Unit, UnitKind} from "../../../../logic/state.js"
import {boardCoords} from "../../../../tools/board-coords.js"
import {RosterCell, TileCell} from "../../../../terminal/parts/selectacon.js"
import {UnitFreedom} from "../../../../logic/simulation/aspects/unit-freedom.js"

export const inspectorPanels = {

	unit(agent: Agent, myTeam: number, selection: TileCell, freedom: UnitFreedom) {
		const unit = agent.units.at(selection.place)
		if (!unit)
			return null

		const info = generalUnitInfo(agent, unit.kind)
		const living = livingUnitInfo(agent, unit, myTeam, freedom)

		return html`
			<div class="panel unit">
				<h1>${living.allegiance} ${info.name} ${living.health.pattern}</h1>
				<p class=essay>${info.essay}</p>
				${listify({
					health: living.health.text,
					actions: living.availability,
				})}
				${listify(info.stats)}
				${cardify(info.cards)}
			</div>
		`
	},

	tile(agent: Agent, selection: TileCell) {
		const {place, tile} = selection
		const {claim} = tile
		const hasClaims = claim.resource || claim.watchtower || claim.tech
		const stakingCost = agent.claims.getStakingCost(place)
		const stakeholder = agent.claims.getStakeholder(place)?.kind
		const elevation = tile.elevation + (tile.step ? 0.5 : 0)
		return html`
			<div class="panel tile">
				<h1>Tile ${boardCoords(place)}</h1>
				${elevation === 0
					? html`<p>Non-traversable.</p>`
					: null}
				${listify({
					elevation,
					"staking cost": stakingCost || null,
					"currently staked by": stakeholder,
				})}
				${hasClaims ? html`
					<h2>Claims</h2>
					${listify({
						resource: claim.resource
							&& `+${agent.claims.determineResourceClaimLevel(place, claim.resource)} income per turn (${claim.resource.stockpile} remains)`,
						watchtower: claim.watchtower
							&& `watchtower ${claim.watchtower.range}`,
						unlocks: claim.tech && Object.entries(claim.tech)
							.filter(([,b]) => b)
							.map(([name]) => name)
							.join(" and "),
					})}
				` : null}
				${stakeholder
					? null
					: html`<p>Unclaimed: nobody is staking this claim.</p>`}
			</div>
		`
	},

	roster(agent: Agent, selection: RosterCell) {
		const info = generalUnitInfo(agent, selection.unitKind)
		return html`
			<div class="panel roster">
				<h1>Roster ${capitalize(selection.unitKind)}</h1>
				<p class=essay>${info.essay}</p>
				${listify(info.stats)}
				${cardify(info.cards)}
			</div>
		`
	},
}

function listify(stats: Record<string, any>) {
	return html`
		<ul>
			${Object.entries(stats)
			.filter(([,v]) => is.defined(v))
			.map(([key, value]) => html`
				<li>
					<strong>${key}</strong>
					<span>${value}</span>
				</li>
			`)}
		</ul>
	`
}

function cardify(cards: Record<string, Record<string, any> | null>) {
	return Object.entries(cards)
		.filter(([,card]) => !!card)
		.map(([name, card]) => html`
			<div class=cards>
				<div class=card>
					<h3>${name}</h3>
					${listify(card!)}
				</div>
			<div>
		`)
}

function generalUnitInfo(agent: Agent, unitKind: UnitKind) {
	const arc = agent.archetype(unitKind)
	const name = capitalize(unitKind)
	const essay = unitEssays[unitKind]

	const cards = {
		move: arc.move,
		attack: arc.attack,
		vision: arc.vision,
	}

	return {
		name,
		essay,
		cards,
		stats: {
			cost: arc.cost ?? "not for sale",
			health: arc.health ?? "invincible",
			stakeholder: arc.stakeholder ? "can stake claims" : null,
			"action-cap": arc.actionCap ?? null,
			"spawns": arc.spawning
				? "can spawn units"
				: null,
		},
	}
}

function livingUnitInfo(agent: Agent, unit: Unit, myTeam: number, freedom: UnitFreedom) {
	const arc = agent.archetype(unit.kind)

	const allegiance = (
		(unit.team === myTeam)
			? "Friendly"
		: (unit.team === null)
			? "Neutral"
			: "Enemy"
	)

	const health = (() => {
		let text: string | null = null
		let pattern: string | null = null
		if (arc.health) {
			const currentHealth = arc.health - unit.damage
			text = `${currentHealth}/${arc.health}`
			pattern = ""
			for (const i of loop(arc.health)) {
				pattern += (i < currentHealth)
					? "■"
					: "□"
			}
		}
		return {text, pattern}
	})()

	const availability = (() => {
		const report = freedom.report(unit.id, arc)
		if (report.canAct) {
			const can: string[] = []
			if (report.canMove) can.push("move")
			if (report.canAttack) can.push("attack")
			if (can.length > 0)
				return `can ${can.join(", ")}`
		}
		else return "exhausted"
	})()

	return {
		health,
		allegiance,
		availability,
	}
}

function capitalize(s: string) {
	return s.at(0)!.toUpperCase() + s.slice(1)
}

