
import {html} from "@benev/slate"
import {Orchestrator, orchestratorStyles, OrchestratorView} from "@benev/toolbox"

import styles from "./styles.js"
import {nexus} from "../../nexus.js"
import {constants} from "../../../constants.js"
import {GameSession} from "../../../net/game-session.js"
import {GameplayView} from "../../views/exhibits/gameplay.js"
import {detectInputMethod} from "../../utils/input-method.js"
import {loadImage} from "../../../tools/loading/load-image.js"
import {MainMenuView} from "../../views/exhibits/main-menu.js"
import {InitialMemo} from "../../../director/apis/clientside.js"
import {LogoSplashView} from "../../views/loading-screens/logo-splash.js"

export const GameApp = nexus.shadowComponent(use => {
	use.styles(styles)

	use.mount(
		detectInputMethod(document, use.context.inputMethod)
	)

	// preload the benev logo
	use.load(async() => await loadImage(
		constants.urls.benevLogo,
		"benevolent.games",
	))

	const orchestrator = use.once(() => {
		const mainMenu = Orchestrator.makeExhibit({
				dispose: () => {},
				template: () => MainMenuView([{
					goFreeplay: () => goExhibit.freeplay(),
					goVersus: (memo: InitialMemo) => goExhibit.versus(memo),
				}], {content: html`<slot></slot>`}),
			})

		const orchestrator = new Orchestrator({
			animTime: constants.ui.loadAnimTime,
			startingExhibit: mainMenu,
		})

		const loadscreens = {
			logoSplash: Orchestrator.makeLoadingScreen({
				render: ({active}) => LogoSplashView([active]),
			}),
		}

		const goExhibit = {
			mainMenu: orchestrator.makeNavFn(loadscreens.logoSplash, async() => {
				return mainMenu
			}),

			freeplay: orchestrator.makeNavFn(loadscreens.logoSplash, async() => {
				const {freeplayFlow} = await import("../../../flows/freeplay.js")
				const {world, bridge, dispose} = await freeplayFlow()
				const exit = () => goExhibit.mainMenu()
				return {
					dispose,
					template: () => GameplayView([{
						world,
						bridge,
						exit,
					}]),
				}
			}),

			versus: orchestrator.makeNavFn(loadscreens.logoSplash, async(memo: InitialMemo) => {
				const {connectivity} = use.context

				const gameSession = new GameSession(connectivity.machinery, memo)

				const exit = () => {
					gameSession.dispose()
					goExhibit.mainMenu()
				}

				const {versusFlow} = await import("../../../flows/versus.js")
				const flow = await versusFlow({
					gameSession,
					connectivity,
					exit,
				})

				if (flow) {
					const {world, bridge} = flow
					return {
						dispose: flow.dispose,
						template: () => GameplayView([{world, bridge, exit}]),
					}
				}
				else
					return {template: () => null, dispose: () => {}}
			}),
		}

		// hack to skip to freeplay
		if (window.location.hash.includes("freeplay"))
			goExhibit.freeplay()

		return orchestrator
	})

	return html`
		${OrchestratorView(orchestrator)}
		<style>${orchestratorStyles}</style>
	`
})

