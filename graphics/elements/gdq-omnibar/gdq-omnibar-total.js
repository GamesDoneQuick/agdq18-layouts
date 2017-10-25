(function () {
	'use strict';

	const TIME_PER_DOLLAR = 0.03;
	const total = nodecg.Replicant('total');
	const bitsTotal = nodecg.Replicant('bits:total');

	class GdqOmnibarTotal extends Polymer.Element {
		static get is() {
			return 'gdq-omnibar-total';
		}

		static get properties() {
			return {};
		}

		ready() {
			super.ready();
			Polymer.RenderStatus.beforeNextRender(this, () => {
				this.$.totalTextAmount.rawValue = 0;
				total.on('change', newVal => {
					this._handleTotalChanged(this.$.totalTextAmount, newVal.raw);
				});

				this.$.bitsTotalAmount.rawValue = 0;
				bitsTotal.on('change', newVal => {
					this._handleTotalChanged(this.$.bitsTotalAmount, newVal);
				});
			});
		}

		_handleTotalChanged($element, newTotal) {
			if (!this._totalInitialized) {
				this._totalInitialized = true;
				$element.rawValue = newTotal;
				$element.textContent = this.formatRawValue(newTotal);
				return;
			}

			const delta = newTotal - $element.rawValue;
			const duration = Math.min(delta * TIME_PER_DOLLAR, 3);
			TweenLite.to($element, duration, {
				rawValue: newTotal,
				ease: Power2.easeOut,
				onUpdate() {
					$element.textContent = this.formatRawValue($element.rawValue);
				},
				callbackScope: this
			});
		}

		formatRawValue(rawValue) {
			return rawValue.toLocaleString('en-US', {
				maximumFractionDigits: 0
			}).replace(/1/ig, '\u00C0');
		}
	}

	customElements.define(GdqOmnibarTotal.is, GdqOmnibarTotal);
})();
