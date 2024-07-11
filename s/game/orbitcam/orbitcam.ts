
import {ArcRotateCamera, Scene, Vector3} from "@babylonjs/core"
import {molasses2d, molasses3d, scalar, Vec2, Vec3} from "@benev/toolbox"

import {PointerCaptor} from "../../tools/pointer-captor.js"
import { Smoothie } from "../../tools/smoothie.js"

const {degrees} = scalar.radians.from

type Options = {
	scene: Scene
	smoothing: number
	verticalRange: Vec2
	orbitSensitivity: number
	zoomRange: Vec2
	zoomSensitivity: number
}

export class Orbitcam {
	readonly camera: ArcRotateCamera
	dispose: () => void

	#down = false

	#gimbal: Vec2 = [0, 0]
	#smoothedGimbal = this.#gimbal

	pivot: Vec3 = [0, 1, 0]
	#smoothedPivot = this.pivot

	zoom = new Smoothie(10, 30)

	constructor(private options: Options) {
		const name = "orbitcam"
		const alpha = 0
		const beta = 0
		const radius = this.zoom.smoothed
		const target = new Vector3(...this.#smoothedPivot)
		this.camera = new ArcRotateCamera(name, alpha, beta, radius, target, options.scene)
		this.dispose = () => this.camera.dispose()
		this.gimbal = [0, degrees(45)]
	}

	get gimbal() {
		return this.#gimbal
	}

	set gimbal([x, y]: Vec2) {
		this.#gimbal = [
			x,
			scalar.clamp(
				y,
				...this.options.verticalRange,
			),
		]
	}

	get topdownness() {
		const [,y] = this.#smoothedGimbal
		return scalar.inverse(
			scalar.remap(y, this.options.verticalRange)
		)
	}

	get zoomedoutness() {
		return scalar.remap(this.zoom.smoothed, this.options.zoomRange)
	}

	#applyZoom() {
		this.camera.radius = this.zoom.tick()
	}

	#applySmoothGimbal() {
		this.#smoothedGimbal = molasses2d(
			this.options.smoothing,
			this.#smoothedGimbal,
			this.#gimbal,
		)
		const [x, y] = this.#smoothedGimbal
		this.camera.alpha = x
		this.camera.beta = y
	}

	#applySmoothPivot() {
		const realpivot = this.#smoothedPivot = molasses3d(
			this.options.smoothing,
			this.#smoothedPivot,
			this.pivot,
		)
		const zeroed: Vec3 = [0, 0, 0]
		const centeredness = this.topdownness * this.zoomedoutness
		console.log("z", this.zoomedoutness.toFixed(2))
		this.camera.target.set(
			scalar.map(centeredness, [realpivot[0], zeroed[0]]),
			scalar.map(centeredness, [realpivot[1], zeroed[1]]),
			scalar.map(centeredness, [realpivot[2], zeroed[2]]),
		)
	}

	tick = () => {
		this.#applySmoothGimbal()
		this.#applySmoothPivot()
		this.#applyZoom()
	}

	#pointerCaptor = new PointerCaptor()

	#cancel = () => {
		this.#down = false
		this.#pointerCaptor.release()
	}

	events = {
		wheel: (event: WheelEvent) => {
			this.zoom.target += event.deltaY * this.options.zoomSensitivity
			this.zoom.target = scalar.clamp(this.zoom.target, ...this.options.zoomRange)
		},

		pointerdown: (event: PointerEvent) => {
			if (event.button === 2) {
				this.#down = true
				this.#pointerCaptor.capture(event)
			}
		},

		pointermove: (event: PointerEvent) => {
			if (this.#down) {
				const [x, y] = this.gimbal
				this.gimbal = [
					x + (event.movementX * this.options.orbitSensitivity),
					y - (event.movementY * this.options.orbitSensitivity),
				]
			}
		},

		pointerleave: this.#cancel,
		pointerup: this.#cancel,
		blur: this.#cancel,
	}
}
