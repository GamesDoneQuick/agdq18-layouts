/* global Random, d3 */

/**
 * @customElement
 * @polymer
 */
class AtomTronlines extends Polymer.Element {
	static get is() {
		return 'atom-tronlines';
	}

	static get properties() {
		return {

			/**
			 * The width of the canvas.
			 */
			width: {
				type: Number,
				value: 450
			},

			/**
			 * The height of the canvas.
			 */
			height: {
				type: Number,
				value: 300
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
				value: 20,
				observer: '_creationRateChanged'
			},

			/**
			 * Expected distance traveled per frame, in pixels.
			 * This is the "mu" value of the normal distribution.
			 */
			speed: {
				type: Number,
				value: 1.5
			},

			/**
			 * Variance in speed per node.
			 * This is the "sigma" of the normal distribution.
			 */
			speedRandomness: {
				type: Number,
				value: 0.25
			},

			/**
			 * Expected distance tail length, in pixels.
			 * This is the "mu" value of the normal distribution.
			 */
			tailLength: {
				type: Number,
				value: 200
			},

			/**
			 * Variance in tail length per node.
			 * This is the "sigma" of the normal distribution.
			 */
			tailLengthRandomness: {
				type: Number,
				value: 5
			},

			/**
			 * The opacity of each node at the start of its path.
			 */
			opacityStart: {
				type: Number,
				value: 0.3
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
				value: '#abd3e9',
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

			debug: {
				type: Boolean,
				reflectToAttribute: true,
				value: false
			},

			/**
			 * An array containing all nodes currently being drawn to the stage.
			 */
			_allocatedNodes: {
				type: Set,
				value() {
					return new Set();
				}
			},

			/**
			 * An array containing all nodes currently unallocated.
			 */
			_freeNodes: {
				type: Set,
				value() {
					return new Set();
				}
			},

			_getRandomSpeed: {
				type: Function,
				computed: '_computeRandomSpeedFunc(speed, speedRandomness)'
			},

			_getRandomTailLength: {
				type: Function,
				computed: '_computeRandomTailLengthFunc(tailLength, tailLengthRandomness)'
			}
		};
	}

	static get observers() {
		return [
			'_resizeCanvas(width, height, direction)'
		];
	}

	static getRandomUniform(min = 0, max = 1) {
		return Random.real(min, max, true)(Random.engines.browserCrypto);
	}

	static get BLOCK_SIZE() {
		return 50;
	}

	static get WARNING_THRESHOLD() {
		return 500;
	}

	ready() {
		super.ready();

		let frameCounter = 0;
		let warnedLeak = false;
		const stage = new createjs.Stage(this.$.canvas);

		const bg = new createjs.Shape();
		this.bgRectCommand = bg.graphics
			.beginFill(this.backgroundColor)
			.drawRect(0, 0, this.width, this.height).command;

		stage.addChild(bg);
		this.stage = stage;

		const handleFrame = () => {
			this.advanceSimulation();

			if (this.debug) {
				const totalNodes = this._allocatedNodes.size + this._freeNodes.size;
				this.$.debugInfo.textContent = `${this._allocatedNodes.size}/${totalNodes}`;
			}

			frameCounter++;
			if (frameCounter > 60) {
				frameCounter = 0;

				if (this._allocatedNodes.size > AtomTronlines.WARNING_THRESHOLD) {
					if (!warnedLeak) {
						console.warn(
							'More than %d nodes are active, this is probably a leak!',
							AtomTronlines.WARNING_THRESHOLD,
							this
						);
						warnedLeak = true;
					}
				} else {
					warnedLeak = false;
				}
			}

			stage.update();
			requestAnimationFrame(handleFrame);
		};

		handleFrame();

		setInterval(() => {
			this._sweepExcessFreeNodes();
		}, 10000);
	}

	/**
	 * Advances the simulation by one tick.
	 * In most cases, this means one frame in a 60fps simulation.
	 * @returns {undefined}
	 */
	advanceSimulation() {
		const opacityRange = Math.abs(this.opacityStart - this.opacityEnd);
		const tickTime = Date.now();
		const TIME_PER_TICK_IDEAL = 1000 / 60;
		Array.from(this._allocatedNodes).forEach(node => {
			let percent = 1;
			if (node.lastTickTime) {
				percent = (tickTime - node.lastTickTime) / TIME_PER_TICK_IDEAL;
			}

			node.y -= node.speed * percent;

			const journeyPercentage = 1 - (node.y / (this._invertDimensions ? this.width : this.height));
			node.alpha = this.opacityStart - (opacityRange * journeyPercentage);
			node.lastTickTime = tickTime;

			// If a node's alpha is less than zero, remove it.
			// Or a node has completely scrolled off the canvas, remove it.
			if (node.alpha <= 0 || (node.y + node.tailLength) <= 0) {
				this._freeNode(node);
			}
		});
	}

	/**
	 * Clears all nodes from the canvas.
	 * @returns {undefined}
	 */
	clear() {
		this._freeAllNodes();
	}

	_creationRateChanged(newVal) {
		if (this._creationInterval) {
			clearInterval(this._creationInterval);
		}

		this._creationInterval = setInterval(() => {
			if (this._freeNodes.size <= 0) {
				this._createBlockOfFreeNodes(AtomTronlines.BLOCK_SIZE);
			}
			const node = this._freeNodes.values().next().value;
			this._allocateNode(node);
		}, (1000 / newVal));
	}

	/**
	 * Creates and adds a block of new nodes to the _freeNodes array.
	 * @param {Number} blockSize - The number of nodes to add.
	 * @private
	 * @returns {undefined}
	 */
	_createBlockOfFreeNodes(blockSize) {
		for (let i = 0; i < blockSize; i++) {
			this._freeNodes.add(this._createNode());
		}
	}

	/**
	 * Creates a new node instance.
	 * @private
	 * @returns {createjs.Shape} - The created node instance.
	 */
	_createNode() {
		const shape = new createjs.Shape();
		const tailEndColor = createjs.Graphics.getRGB(parseInt(this.tailColor.slice(1), 16), 0);
		const maxTailLength = this.tailLength + this.tailLengthRandomness;

		shape.tailGradientCommand = shape.graphics
			.beginLinearGradientFill([this.tailColor, tailEndColor], [0, 1], 0, 0, 0, maxTailLength).command;

		shape.tailRectCommand = shape.graphics
			.drawRect(0, 0, this.nodeSize, 0).command;

		shape.graphics
			.beginFill(this.nodeColor)
			.drawRect(0, 0, this.nodeSize, this.nodeSize);

		shape.cache(0, 0, this.nodeSize, maxTailLength);

		return shape;
	}

	/**
	 * Adds a node to the stage.
	 * @param {createjs.Shape} node - The node to add to the stage.
	 * @private
	 * @returns {undefined}
	 */
	_allocateNode(node) {
		const tailLength = this._getRandomTailLength();

		node.tailGradientCommand.style.props.ratios[0] = Math.min(this.nodeSize / this.tailLength, 1);
		node.tailGradientCommand.style.props.y1 = tailLength;
		node.tailRectCommand.h = tailLength;

		node.updateCache();
		node.tailLength = tailLength;
		node.speed = this._getRandomSpeed();
		node.alpha = this.opacityStart;
		node.y = this._invertDimensions ? this.width : this.height;
		node.x = AtomTronlines.getRandomUniform(0, this._invertDimensions ? this.height : this.width);
		node.lastTickTime = null;

		this.stage.addChild(node);
		this._freeNodes.delete(node);
		this._allocatedNodes.add(node);
	}

	/**
	 * Removes all nodes from the stage, returning them to the pool.
	 * @private
	 * @returns {undefined}
	 */
	_freeAllNodes() {
		this._allocatedNodes.forEach(node => {
			this._freeNode(node);
		});
	}

	/**
	 * Frees a node, removing it from the stage and returning it to the pool.
	 * @param {createjs.DisplayObject} node - The node to free.
	 * @private
	 * @returns {undefined}
	 */
	_freeNode(node) {
		this.stage.removeChild(node);
		this._allocatedNodes.delete(node);
		this._freeNodes.add(node);
	}

	/**
	 * Removes excess free nodes.
	 * Excess free nodes are caused by tabbing away from the page,
	 * or after lowering the node creation rate.
	 * @private
	 * @returns {undefined}
	 */
	_sweepExcessFreeNodes() {
		if (this._freeNodes.size > AtomTronlines.BLOCK_SIZE * 2) {
			const freeNodesToKeep = Array.from(this._freeNodes).slice(0, AtomTronlines.BLOCK_SIZE);
			this._freeNodes = new Set(freeNodesToKeep);
		}
	}

	_computeRandomSpeedFunc(speed, speedRandomness) {
		return d3.randomNormal.source(AtomTronlines.getRandomUniform)(speed, speedRandomness);
	}

	_computeRandomTailLengthFunc(tailLength, tailLengthRandomness) {
		return d3.randomNormal.source(AtomTronlines.getRandomUniform)(tailLength, tailLengthRandomness);
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

customElements.define(AtomTronlines.is, AtomTronlines);
