/* global Random */

/**
 * @customElement
 * @polymer
 */
class GdqTronlines extends Polymer.Element {
	static get is() {
		return 'gdq-tronlines';
	}

	static get properties() {
		return {

			/**
			 * The width of the canvas.
			 */
			width: {
				type: Number,
				value: 350
			},

			/**
			 * The height of the canvas.
			 */
			height: {
				type: Number,
				value: 200
			},

			_invertDimensions: {
				type: Boolean,
				computed: '_computeInvertDimensions(direction)'
			},

			/**
			 * The solid background color of the canvas.
			 */
			backgroundColor: {
				type: String,
				value: '#051113',
				elementTester: {
					type: 'color'
				}
			},

			/**
			 * The direction of travel for the nodes.
			 * Can be one of "up", "down", "left", or "right".
			 */
			direction: {
				type: String,
				value: 'up',
				reflectToAttribute: true,
				elementTester: {
					enum: ['up', 'down', 'left', 'right']
				}
			},

			/**
			 * The width and height of each node, in pixels.
			 */
			nodeSize: {
				type: Number,
				value: 2
			},

			/**
			 * Nodes created per second.
			 */
			creationRate: {
				type: Number,
				value: 3,
				observer: '_creationRateChanged'
			},

			/**
			 * Distance traveled per frame, in pixels.
			 */
			speed: {
				type: Number,
				value: 0.5
			},

			/**
			 * Ratio by which the speed is allowed to vary by node.
			 * A randomness of 0.2 with a speed of 1 will result in a speed range of 0.8-1.2
			 * A randomness of 0.2 with a speed of 10 will result in a speed range of 8-12.
			 */
			speedRandomness: {
				type: Number,
				value: 0.2
			},

			minSpeed: {
				type: Number,
				computed: '_computeMinSpeed(speed, speedRandomness)'
			},

			maxSpeed: {
				type: Number,
				computed: '_computeMaxSpeed(speed, speedRandomness)'
			},

			/**
			 * Length of a node's tail, in pixels.
			 */
			tailLength: {
				type: Number,
				value: 100
			},

			/**
			 * Ratio by which tail length is allowed to vary by node.
			 * A randomness of 0.2 with a tailLength of 1 will result in a tail length range of 0.8-1.2
			 * A randomness of 0.2 with a tailLength of 10 will result in a tail length range of 8-12.
			 */
			tailLengthRandomness: {
				type: Number,
				value: 0.2
			},

			minTailLength: {
				type: Number,
				computed: '_computeMinTailLength(tailLength, tailLengthRandomness)'
			},

			maxTailLength: {
				type: Number,
				computed: '_computeMaxTailLength(tailLength, tailLengthRandomness)'
			},

			/**
			 * The opacity of each node at the start of its path.
			 */
			opacityStart: {
				type: Number,
				value: 0.9
			},

			/**
			 * The opacity of each node at the end of its path.
			 */
			opacityEnd: {
				type: Number,
				value: 0.2
			},

			/**
			 * The color of the head of each node.
			 */
			nodeColor: {
				type: String,
				value: '#516d71',
				elementTester: {
					type: 'color'
				}
			},

			/**
			 * The color of the tail of each node.
			 */
			tailColor: {
				type: String,
				value: '#12383c',
				elementTester: {
					type: 'color'
				}
			},

			/**
			 * An array containing all currently active nodes.
			 */
			nodes: {
				type: Array,
				value() {
					return [];
				}
			}
		};
	}

	static get observers() {
		return [
			'_resizeCanvas(width, height, direction)'
		];
	}

	static getRandomReal(min, max) {
		return Random.real(min, max, true)(Random.engines.browserCrypto);
	}

	ready() {
		super.ready();

		let warnedLeak = false;
		const stage = new createjs.Stage(this.$.canvas);
		createjs.Ticker.framerate = 60;
		createjs.Ticker.on('tick', () => {
			this.advanceSimulation();
			this.removeInvisibleNodes();

			if (this.nodes.length > 1000) {
				if (!warnedLeak) {
					console.warn('More than 1000 nodes are active, this is probably a leak!', this);
					warnedLeak = true;
				}
			} else {
				warnedLeak = false;
			}

			stage.update();
		});

		const bg = new createjs.Shape();
		this.bgRectCommand = bg.graphics
			.beginFill(this.backgroundColor)
			.drawRect(0, 0, this.width, this.height).command;

		stage.addChild(bg);
		this.stage = stage;
	}

	/**
	 * Creates a new node instance.
	 * Does not automatically add it to the stage.
	 * @returns {createjs.Shape} - The created node instance.
	 */
	createNode() {
		const node = new createjs.Shape();
		const tailLength = GdqTronlines.getRandomReal(this.minTailLength, this.maxTailLength);
		const tailEndColor = createjs.Graphics.getRGB(this.tailColor, 0.2);
		const firstGradientStop = Math.min(this.nodeSize / this.tailLength, 1);
		node.graphics
			.beginLinearGradientFill([this.tailColor, tailEndColor], [firstGradientStop, 1], 0, 0, 0, tailLength)
			.drawRect(0, 0, this.nodeSize, tailLength)
			.beginFill(this.nodeColor)
			.drawRect(0, 0, this.nodeSize, this.nodeSize);
		node.cache(0, 0, this.nodeSize, tailLength);
		node.tailLength = tailLength;
		node.speed = GdqTronlines.getRandomReal(this.minSpeed, this.maxSpeed);
		node.alpha = this.opacityStart;
		node.y = this._invertDimensions ? this.width : this.height;
		node.x = GdqTronlines.getRandomReal(0, this._invertDimensions ? this.height : this.width);
		return node;
	}

	/**
	 * Adds a node to the stage.
	 * @param {createjs.DisplayObject} node - The node to add to the stage.
	 * @returns {undefined}
	 */
	dispatchNode(node) {
		this.stage.addChild(node);
		this.push('nodes', node);
	}

	/**
	 * Advances the simulation by one tick.
	 * In most cases, this means one frame in a 60fps simulation.
	 * @returns {undefined}
	 */
	advanceSimulation() {
		const opacityRange = Math.abs(this.opacityStart - this.opacityEnd);
		this.nodes.forEach(node => {
			node.y -= node.speed;

			const journeyPercentage = 1 - (node.y / (this._invertDimensions ? this.width : this.height));
			node.alpha = this.opacityStart - (opacityRange * journeyPercentage);
		});
	}

	/**
	 * Removes all invisible nodes by removing them from both
	 * the this.nodes array and this.stage.
	 * @returns {undefined}
	 */
	removeInvisibleNodes() {
		this.nodes = this.nodes.filter(node => {
			// If a node's alpha is less than zero, remove it.
			if (node.alpha <= 0) {
				this.removeNode(node);
				return false;
			}

			// If a node has completely scrolled off the canvas, remove it.
			if ((node.y + node.tailLength) <= 0) {
				this.removeNode(node);
				return false;
			}

			// Else, keep it.
			return true;
		});
	}

	removeNode(node) {
		this.stage.removeChild(node);
	}

	_creationRateChanged(newVal) {
		if (this._creationInterval) {
			clearInterval(this._creationInterval);
		}

		this._creationInterval = setInterval(() => {
			const node = this.createNode();
			this.dispatchNode(node);
		}, (1000 / newVal));
	}

	_computeMinSpeed(speed, randomness) {
		return speed - (speed * randomness);
	}

	_computeMaxSpeed(speed, randomness) {
		return speed + (speed * randomness);
	}

	_computeMinTailLength(tailLength, randomness) {
		return tailLength - (tailLength * randomness);
	}

	_computeMaxTailLength(tailLength, randomness) {
		return tailLength + (tailLength * randomness);
	}

	_resizeCanvas(width, height, direction) {
		this.style.width = `${width}px`;
		this.style.height = `${height}px`;

		if (direction === 'left' || direction === 'right') {
			const temp = width;
			width = height;
			height = temp;
		}

		this.$.canvas.width = width;
		this.$.canvas.height = height;

		if (this.bgRectCommand) {
			this.bgRectCommand.w = width;
			this.bgRectCommand.h = height;
		}
	}

	_computeInvertDimensions(direction) {
		return direction === 'left' || direction === 'right';
	}
}

customElements.define(GdqTronlines.is, GdqTronlines);
