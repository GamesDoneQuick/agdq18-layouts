/* global CSSReflectionMixin */
/**
 * @customElement
 * @polymer
 */
class AtomArrowBlock extends CSSReflectionMixin(Polymer.Element) {
	static get is() {
		return 'atom-arrow-block';
	}

	static get properties() {
		return {
			glow: {
				type: Boolean,
				value: true
			}
		};
	}

	static get DEFAULT_STROKE_SIZE() {
		return 1;
	}

	static get DEFAULT_CHEVRON_WIDTH() {
		return 17;
	}

	static get DEFAULT_SHADOW_SIZE() {
		return 12;
	}

	/**
	 * Creates a new arrow block shape as an SVG.js Polygon.
	 * The chevron always points right.
	 * If you need it to point another way, apply a transform to it.
	 * @param {Number} height - How tall, in pixels, to draw the arrow block.
	 * @param {Number} bodyWidth - How wide, in pixels, to draw the straight body part of the arrow block.
	 * @param {Number} chevronWidth - How wide, in pixels, to draw the chevron ends of the arrow block;
	 * @param {String} fillColor - The color to apply to the interior of the arrow block.
	 * @param {Number} fillOpacity - The opacity to apply to the fillColor.
	 * @param {Number} strokeSize - The thickness of the arrow block border.
	 * @param {String} strokeColor - The color to apply to the border of the arrow block.
	 * @returns {svgjs.Polygon} - The constructed SVG.js Polygon instance.
	 */
	static createArrowBlock({height, bodyWidth, chevronWidth, fillColor, fillOpacity, strokeSize, strokeColor}) {
		const chevron = new SVG.Polygon();
		const pointArray = AtomArrowBlock.createArrowBlockPointArray({height, bodyWidth, chevronWidth});
		chevron.plot(pointArray);
		chevron.fill({color: fillColor, opacity: fillOpacity});
		if (strokeSize > 0) {
			chevron.stroke({width: strokeSize, color: strokeColor});
		}

		return chevron;
	}

	static createArrowBlockPointArray({height, bodyWidth, chevronWidth}) {
		return new SVG.PointArray([
			[0, 0],
			[chevronWidth + bodyWidth, 0],
			[(chevronWidth * 2) + bodyWidth, height / 2],
			[chevronWidth + bodyWidth, height],
			[0, height],
			[chevronWidth, height / 2]
		]);
	}

	ready() {
		super.ready();
		this.svgDoc = SVG(this.shadowRoot);
	}

	render({useContentWidth = true} = {}) {
		this.svgDoc.clear();
		this.svgDoc.size(0, 0);

		const strokeSize = parseInt(this.readCSSCustomProperty(
			'--atom-arrow-block-stroke-size',
			AtomArrowBlock.DEFAULT_STROKE_SIZE
		), 10);
		const chevronWidth = parseInt(this.readCSSCustomProperty(
			'--atom-arrow-block-chevron-width',
			AtomArrowBlock.DEFAULT_CHEVRON_WIDTH
		), 10);
		const shadowSize = parseFloat(this.readCSSCustomProperty(
			'--atom-arrow-block-shadow-size',
			AtomArrowBlock.DEFAULT_SHADOW_SIZE
		));
		const fillOpacity = parseFloat(this.readCSSCustomProperty(
			'--atom-arrow-block-fill-opacity',
			1
		));

		const bodyWidth = useContentWidth ?
			this.$.content.clientWidth :
			this.getBoundingClientRect().width - (chevronWidth * 2) - strokeSize;
		const height = this.clientHeight;
		const width = bodyWidth + (chevronWidth * 2) + strokeSize;

		const arrowBlock = AtomArrowBlock.createArrowBlock({
			height: height - strokeSize,
			bodyWidth,
			chevronWidth,
			fillColor: this.readCSSCustomProperty('--atom-arrow-block-fill-color'),
			fillOpacity,
			strokeSize,
			strokeColor: this.readCSSCustomProperty('--atom-arrow-block-stroke-color')
		});

		let moveAmt = (strokeSize / 2);
		if (this.glow) {
			arrowBlock.attr({filter: 'url(#glowFilter)'});
			this.svgDoc.node.appendChild(this.$.filterDefs);
			this.svgDoc.node.style.marginRight = `${-shadowSize * 2}px`;
			this.svgDoc.transform({x: -shadowSize, y: -shadowSize});
			moveAmt = (strokeSize / 2) + shadowSize;
			this.svgDoc.size(width + (shadowSize * 2), height + (shadowSize * 2));
		} else {
			this.svgDoc.size(width, height);
		}

		this.$.filterHolder.remove();
		arrowBlock.move(moveAmt, moveAmt);
		this.arrowBlock = arrowBlock;
		this.svgDoc.add(arrowBlock);
	}
}

customElements.define(AtomArrowBlock.is, AtomArrowBlock);
