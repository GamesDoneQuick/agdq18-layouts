/**
 * @customElement
 * @polymer
 */
class DashHostBidOption extends Polymer.Element {
	static get is() {
		return 'dash-host-bid-option';
	}

	static get properties() {
		return {
			bid: Object,
			option: Object,
			index: {
				type: Number,
				reflectToAttribute: true
			}
		};
	}

	calcOptionMeterFillStyle(bid, option) {
		if (!bid || !option || !bid.options || bid.options.length <= 0) {
			return '';
		}

		let percent = option.rawTotal / bid.options[0].rawTotal;
		percent = Math.max(percent, 0); // Clamp to min 0
		percent = Math.min(percent, 1); // Clamp to max 1
		if (Number.isNaN(percent)) {
			percent = 0;
		}
		return `transform: scaleX(${percent});`;
	}
}

customElements.define(DashHostBidOption.is, DashHostBidOption);
