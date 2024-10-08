
import {loop} from "@benev/toolbox"
import {TeamTimeReport, TimeRecord, TimeReport, TimeRules} from "./types.js"

export class ChessTimer {
	#team = 0
	#gameStart = Date.now()
	#turnStart = this.#gameStart
	#teams: TimeRecord[]

	constructor(public rules: TimeRules | undefined, teamCount: number) {
		this.#teams = [...loop(teamCount)].map(() => ({
			elapsed: 0,
			benefits: 0,
		}))
	}

	static updateRecord(
			rules: TimeRules | undefined,
			stale: TimeRecord,
			sinceTurnStart: number,
		) {

		const elapsed = stale.elapsed + sinceTurnStart
		let benefits = stale.benefits

		if (rules) {

			// award charity benefit
			benefits += rules.charity

			// award delay benefit
			const delay = Math.min(sinceTurnStart, rules.delay)
			benefits += delay
		}

		return {elapsed, benefits}
	}

	static calculateTeamReport(
			rules: TimeRules | undefined,
			record: TimeRecord,
		): TeamTimeReport {

		const {elapsed, benefits} = record

		const remaining = (rules)
			? (rules.limit - elapsed) + benefits
			: null

		const expired = (remaining === null)
			? false
			: remaining < 0

		return {elapsed, benefits, remaining, expired}
	}

	reset() {
		const now = Date.now()
		this.#gameStart = now
		this.#turnStart = now
	}

	get gameTime() {
		return Date.now() - this.#gameStart
	}

	get team() {
		return this.#team
	}

	set team(team: number) {
		const nextTeam = team
		const previousTeam = this.#team
		const teamChanged = nextTeam !== previousTeam

		if (teamChanged) {
			const {rules} = this
			const stale = this.#teams[previousTeam]
			const sinceTurnStart = Date.now() - this.#turnStart

			// update record
			const record = ChessTimer.updateRecord(rules, stale, sinceTurnStart)
			this.#teams[previousTeam] = record

			// update local state for next turn
			this.#team = nextTeam
			this.#turnStart = Date.now()
		}
	}

	static generateTeamwise(
			rules: TimeRules | undefined,
			teamRecords: TimeRecord[],
			currentTeamId: number,
			since: number,
		) {
		return teamRecords
			.map((stale, teamId): TeamTimeReport => {
				const record = teamId === currentTeamId
					? ChessTimer.updateRecord(rules, stale, since)
					: stale
				return ChessTimer.calculateTeamReport(rules, record)
			})
	}

	report(): TimeReport {
		const {gameTime, rules} = this
		const sinceTurnStart = Date.now() - this.#turnStart

		const teamwise = ChessTimer.generateTeamwise(
			rules,
			this.#teams,
			this.#team,
			sinceTurnStart,
		)

		return {gameTime, teamwise}
	}
}

