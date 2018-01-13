(function () {
	'use strict';

	const total = nodecg.Replicant('total');

	class GdqOmnibarTotal extends Polymer.Element {
		static get is() {
			return 'gdq-omnibar-total';
		}

		ready() {
			super.ready();
			this.$.totalTextAmount.displayValueTransform = this._totalDisplayValueTransform.bind(this);
			total.on('change', newVal => {
				this.$.totalTextAmount.value = newVal.raw;
			});
		}

		_totalDisplayValueTransform(displayValue) {
			const formatted = displayValue.toLocaleString('en-US', {
				maximumFractionDigits: 0,
				minimumFractionDigits: 0
			}).replace(/1/ig, '\u00C0');

			// Part of the workaround for https://bugs.chromium.org/p/chromium/issues/detail?id=67029
			this.$.totalTextAmountPlaceholder.textContent = formatted;

			return formatted;
		}
	}

	customElements.define(GdqOmnibarTotal.is, GdqOmnibarTotal);
})();
