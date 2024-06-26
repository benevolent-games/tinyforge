
import {SVGTemplateResult} from "@benev/slate"

export class Device {
	#inputs: Inputs
	#actionlist: Action[]

	constructor(inputs: Inputs, actionlist: Action[]) {
		this.#inputs = inputs
		this.#actionlist = actionlist
	}

	#find(code: string) {
		return this.#actionlist.filter(
			action => action.buttons.includes(code)
		)
	}

	keydown = (event: KeyboardEvent) => {
		const actions = this.#find(event.code)
		for (const action of actions)
			this.#inputs.invoke(action, {down: true, repeat: event.repeat})
	}

	keyup = (event: KeyboardEvent) => {
		const actions = this.#find(event.code)
		for (const action of actions)
			this.#inputs.invoke(action, {down: false, repeat: event.repeat})
	}
}

export class Inputs {
	#listeners = new Map<Action, Set<Listener>>()

	on(action: Action, listener: Listener) {
		let set = this.#listeners.get(action)
		if (!set) {
			set = new Set<Listener>()
			this.#listeners.set(action, set)
		}
		set.add(listener)
		return () => set.delete(listener)
	}

	invoke(action: Action, input: Input) {
		const set = this.#listeners.get(action)
		if (set)
			for (const action of set)
				action(input)
	}
}

export type Action = {
	label: string
	buttons: string[]
	icon: null | SVGTemplateResult
}

export type Actions = Record<string, Action>
export type Modes = Record<string, Actions>

export function actions<A extends Actions>(a: A) {
	return a
}

export function modes<M extends Modes>(m: M) {
	return m
}

export type Input = {
	down: boolean
	repeat: boolean
}

export type Listener = ({}: Input) => void

