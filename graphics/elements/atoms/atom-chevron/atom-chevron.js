/**
 * @customElement
 * @polymer
 */
class AtomChevron extends Polymer.Element {
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
				value: 'right'
			}
		};
	}

	static get DEFAULT_THICKNESS() {
		return 6;
	}

	static get DEFAULT_HEIGHT() {
		return 16;
	}

	static get DEFAULT_WIDTH() {
		return 27;
	}

	static get STROKE_SIZE() {
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
	 * @param {String} strokeColor - The color to apply to the border of the chevron.
	 * @returns {svgjs.Polygon} - The constructed SVG.js Polygon instance.
	 */
	static createChevron({width, height, thickness, fillColor, strokeColor}) {
		const chevron = new SVG.Polygon();
		chevron.plot([
			[0, 0],
			[thickness, 0],
			[width, height / 2],
			[thickness, height],
			[0, height],
			[width - thickness, height / 2]
		]);

		chevron.fill(fillColor);
		chevron.stroke({width: 1, color: strokeColor});
		return chevron;
	}

	/**
	 * Creates a new solidly filled triangle as an SVG.js Polygon.
	 * The triangle always points right.
	 * If you need it to point another way, apply a transform to it.
	 * @param {Number} width - How wide, in pixels, to draw the triangle.
	 * @param {Number} height - How tall, in pixels, to draw the triangle.
	 * @param {String} fillColor - The color to apply to the interior of the chevron.
	 * @returns {svgjs.Polygon} - The constructed SVG.js Polygon instance.
	 */
	static createFillTriangle({width, height, fillColor}) {
		const triangle = new SVG.Polygon();
		triangle.plot([
			[0, 0],
			[width, height / 2],
			[0, height]
		]);

		triangle.fill(fillColor);
		return triangle;
	}

	ready() {
		super.ready();
		this.svgDoc = SVG(this.shadowRoot);
	}

	connectedCallback() {
		super.connectedCallback();
		Polymer.RenderStatus.afterNextRender(this, this.render);
	}

	render() {
		this.svgDoc.clear();

		const strokeSize = AtomChevron.STROKE_SIZE;
		const width = this.clientWidth;
		const height = this.clientHeight;
		const thickness = parseInt(this.readCSSCustomProperty('--atom-chevron-thickness', 6), 10);
		this.svgDoc.size(width, height);

		const fillTriangle = AtomChevron.createFillTriangle({
			width: width - thickness,
			height: height - 2,
			fillColor: this.readCSSCustomProperty('--atom-chevron-background-color')
		});

		const chevron = AtomChevron.createChevron({
			width: width - strokeSize,
			height: height - strokeSize,
			thickness,
			fillColor: this.readCSSCustomProperty('--atom-chevron-fill-color'),
			strokeColor: this.readCSSCustomProperty('--atom-chevron-stroke-color')
		});

		fillTriangle.move(0, strokeSize);
		chevron.move(strokeSize / 2, strokeSize / 2);
		this.svgDoc.add(fillTriangle);
		this.svgDoc.add(chevron);

		if (this.direction === 'left') {
			this.svgDoc.transform({scaleX: -1});
		}
	}

	/**
	 * Gets the value of a Custom CSS Property.
	 * @param {String} prop - The property name to get the value of.
	 * @param {*} [fallback] - An optional fallback value to use if the property is not defined.
	 * @returns {String} - The value of the Custom CSS Property, which is always a string.
	 */
	readCSSCustomProperty(prop, fallback) {
		let value;
		if ('ShadyCSS' in window) {
			value = window.ShadyCSS.getComputedStyleValue(this, prop);
		} else {
			value = getComputedStyle(this, prop);
		}

		return value || fallback;
	}
}

customElements.define(AtomChevron.is, AtomChevron);
