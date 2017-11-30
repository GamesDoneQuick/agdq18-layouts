(function () {
	'use strict';

	const cashTotal = nodecg.Replicant('total');
	const bitsTotal = nodecg.Replicant('bits:total');

	class DashHostTotals extends Polymer.Element {
		static get is() {
			return 'dash-host-totals';
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

	customElements.define(DashHostTotals.is, DashHostTotals);
})();
