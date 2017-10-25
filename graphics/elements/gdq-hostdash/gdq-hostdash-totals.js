(function () {
	'use strict';

	const cashTotal = nodecg.Replicant('total');
	const bitsTotal = nodecg.Replicant('bits:total');

	class GdqHostdashTotals extends Polymer.Element {
		static get is() {
			return 'gdq-hostdash-totals';
		}

		static get properties() {
			return {
				cashTotal: {
					type: String
				},
				bitsTotal: {
					type: String
				}
			};
		}

		connectedCallback() {
			super.connectedCallback();
			cashTotal.on('change', newVal => {
				this.cashTotal = newVal.formatted;
			});
			bitsTotal.on('change', newVal => {
				this.bitsTotal = newVal.toLocaleString('en-US');
			});
		}
	}

	customElements.define(GdqHostdashTotals.is, GdqHostdashTotals);
})();
