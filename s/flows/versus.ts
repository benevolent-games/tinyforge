
import {Trashbin} from "@benev/slate"

import {Agent} from "../logic/agent.js"
import {printReport} from "./utils/print-report.js"
import {Connectivity} from "../net/connectivity.js"
import {makeGameTerminal} from "../terminal/terminal.js"
import {StartMemo} from "../director/apis/clientside.js"
import {TimerObserver} from "../tools/chess-timer/timer-observer.js"
import {TurnTracker} from "../logic/simulation/aspects/turn-tracker.js"
import {requestAnimationFrameLoop} from "../tools/request-animation-frame-loop.js"
import { PortholePod } from "../dom/utils/porthole.js"

export async function versusFlow({
		data: startData,
		connectivity,
		exit,
	}: {
		data: StartMemo
		connectivity: Connectivity
		exit: () => void
	}) {

	const trashbin = new Trashbin()
	const dr = trashbin.disposer

	const teamId = startData.teamId

	const agent = new Agent(startData.agentState)
	const connection = connectivity.connection.payload

	const turnTracker = new TurnTracker(agent, teamId)

	const terminal = await makeGameTerminal(
		agent,
		turnTracker,
		turn => connectivity
			.connection.payload?.serverside
			.game.submitTurn(turn),
	)

	const timerObserver = new TimerObserver(
		agent.state.initial.config.time,
		startData.timeReport,
	)

	// data that gets sent to the ui
	const portholePod = new PortholePod(
		terminal,
		() => timerObserver.report(agent.activeTeamId),
	)

	dr(requestAnimationFrameLoop(portholePod.update))
	printReport(agent, teamId)

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
		timerObserver.update(data.timeReport)
		printReport(agent, teamId)
	}))

	dr(connectivity.machinery.onGameEnd(() => {
		console.log("versus got onGameEnd")
		exit()
	}))

	return {
		porthole: portholePod.porthole,
		world: terminal.world,
		dispose() {
			terminal.dispose()
			trashbin.dispose()
		},
	}
}

