(function () {
	'use strict';

	class GdqTotalsTotal extends Polymer.Element {
		static get is() {
			return 'gdq-totals-total';
		}

		static get properties() {
			return {
				value: {
					type: String,
					value: '?'
				},
				currency: {
					type: String
				}
			};
		}

		edit() {
			this.dispatchEvent(new CustomEvent('edit', {bubbles: true, composed: true}));
		}

		equal(a, b) {
			return a === b;
		}
	}

	customElements.define(GdqTotalsTotal.is, GdqTotalsTotal);
})();
