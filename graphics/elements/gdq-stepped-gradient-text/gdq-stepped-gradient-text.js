/* global SteppedGradientMixin */
class GdqSteppedGradientText extends SteppedGradientMixin(Polymer.Element) {
	static get is() {
		return 'gdq-stepped-gradient-text';
	}

	static get properties() {
		return {
			text: {
				type: String
			}
		};
	}

	static get observers() {
		return [
			'recalcGradientStyle(palette, steps)'
		];
	}

	recalcGradientStyle(palette, steps) {
		let str = 'linear-gradient(to bottom,';

		const stepSize = 100 / steps;
		palette.forEach(({r, g, b}, index) => {
			str += `rgb(${r},${g},${b}) ${stepSize * index}%, `;
			str += `rgb(${r},${g},${b}) ${stepSize * (index + 1)}%, `;
		});

		str = str.substring(0, str.length - 2);
		str += ')';
		this.$.foreground.style.backgroundImage = str;
	}
}

customElements.define(GdqSteppedGradientText.is, GdqSteppedGradientText);
