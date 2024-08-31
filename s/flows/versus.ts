
import {interval, Trashbin} from "@benev/slate"

import {Agent} from "../logic/agent.js"
import {printReport} from "./utils/print-report.js"
import {Connectivity} from "../net/connectivity.js"
import {TimeDisplay} from "../dom/utils/time-display.js"
import {makeGameTerminal} from "../terminal/terminal.js"
import {GameStartData} from "../director/apis/clientside.js"
import {TurnTracker} from "../logic/simulation/aspects/turn-tracker.js"
import { TimeReport } from "../logic/utilities/chess-timer.js"

export async function versusFlow({
		data: startData,
		connectivity,
		exit,
	}: {
		data: GameStartData
		connectivity: Connectivity
		exit: () => void
	}) {

	const trashbin = new Trashbin()
	const dr = trashbin.disposer

	const teamIndex = startData.teamId
	let timeReport = startData.timeReport

	const agent = new Agent(startData.agentState)
	const connection = connectivity.connection.payload

	const timeDisplay = new TimeDisplay()
	const updateTimeDisplay = (report: TimeReport) => {
		console.log(report.gameTime)
		timeDisplay.update(
			report,
			teamIndex,
		)
	}

	updateTimeDisplay(startData.timeReport)
	const stopTicker = interval(1000, () => updateTimeDisplay(timeReport))
	printReport(agent, teamIndex)

	if (!connection) {
		exit()
		return null
	}

	dr(connectivity.onDisconnected(() => {
		console.log("versus received disconnect")
		exit()
	}))

	dr(connectivity.machinery.onGameStart((data) => {
		console.log("versus got CONFUSING onGameStart", data)
	}))

	dr(connectivity.machinery.onGameUpdate(data => {
		agent.state = data.agentState
		updateTimeDisplay(data.timeReport)
		printReport(agent, teamIndex)
	}))

	dr(connectivity.machinery.onGameEnd(() => {
		console.log("versus got onGameEnd")
		exit()
	}))

	const turnTracker = new TurnTracker(agent, teamIndex)

	const terminal = await makeGameTerminal(
		agent,
		turnTracker,
		turn => connectivity
			.connection.payload?.serverside
			.game.submitTurn(turn),
	)

	return {
		timeDisplay,
		world: terminal.world,
		dispose() {
			terminal.dispose()
			trashbin.dispose()
		},
	}
}

