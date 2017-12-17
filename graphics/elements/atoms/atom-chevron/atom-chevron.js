/* global CSSReflectionMixin */
/**
 * @customElement
 * @polymer
 */
class AtomChevron extends CSSReflectionMixin(Polymer.Element) {
	static get is() {
		return 'atom-chevron';
	}

	static get properties() {
		return {
			/**
			 * The direction the chevron should point.
			 * Can be "left" or "right".
			 */
			direction: {
				type: String,
				value: 'right',
				reflectToAttribute: true
			},
			noAutoRender: {
				type: Boolean,
				value: false
			}
		};
	}

	static get DEFAULT_THICKNESS() {
		return 6;
	}

	static get DEFAULT_STROKE_SIZE() {
		return 1;
	}

	/**
	 * Creates a new chevron shape as an SVG.js Polygon.
	 * The chevron always points right.
	 * If you need it to point another way, apply a transform to it.
	 * @param {Number} width - How wide, in pixels, to draw the chevron.
	 * @param {Number} height - How tall, in pixels, to draw the chevron.
	 * @param {Number} thickness - How thick, in pixels, to draw the chevron.
	 * @param {String} fillColor - The color to apply to the interior of the chevron.
	 * @param {Number} strokeSize - The thickness of the chevron border.
	 * @param {String} strokeColor - The color to apply to the border of the chevron.
	 * @returns {svgjs.Polygon} - The constructed SVG.js Polygon instance.
	 */
	static createChevron({width, height, thickness, fillColor, strokeSize, strokeColor}) {
		const chevron = new SVG.Polygon();
		const pointArray = AtomChevron.createChevronPointArray({width, height, thickness});
		chevron.plot(pointArray);
		chevron.fill(fillColor);
		if (strokeSize > 0) {
			chevron.stroke({width: strokeSize, color: strokeColor});
		}

		return chevron;
	}

	static createChevronPointArray({width, height, thickness}) {
		return new SVG.PointArray([
			[0, 0],
			[thickness, 0],
			[width, height / 2],
			[thickness, height],
			[0, height],
			[width - thickness, height / 2]
		]);
	}

	ready() {
		super.ready();
		this.svgDoc = SVG(this.shadowRoot);
	}

	connectedCallback() {
		super.connectedCallback();
		if (!this.noAutoRender) {
			Polymer.RenderStatus.afterNextRender(this, this.render);
		}
	}

	render(width, height) {
		this.svgDoc.clear();

		width = typeof width === 'number' ? width : this.scrollWidth;
		height = typeof height === 'number' ? height : this.clientHeight;
		const strokeSize = parseInt(this.readCSSCustomProperty(
			'--atom-chevron-stroke-size',
			AtomChevron.DEFAULT_STROKE_SIZE
		), 10);
		const thickness = parseInt(this.readCSSCustomProperty(
			'--atom-chevron-thickness',
			AtomChevron.DEFAULT_THICKNESS
		), 10);
		this.svgDoc.size(width, height);

		const chevron = AtomChevron.createChevron({
			width: width - strokeSize,
			height: height - strokeSize,
			thickness,
			fillColor: this.readCSSCustomProperty('--atom-chevron-fill-color'),
			strokeSize,
			strokeColor: this.readCSSCustomProperty('--atom-chevron-stroke-color')
		});

		chevron.move(strokeSize / 2, strokeSize / 2);
		this.chevron = chevron;
		this.svgDoc.add(chevron);

		if (this.direction === 'left' && this._lastDirection !== 'left') {
			this.svgDoc.transform({scaleX: -1});
			this._lastDirection = 'left';
		}
	}
}

customElements.define(AtomChevron.is, AtomChevron);
