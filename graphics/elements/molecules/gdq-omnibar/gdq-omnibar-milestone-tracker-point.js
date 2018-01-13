(function () {
	'use strict';

	const ONE_MILLION = 1000000;

	class GdqOmnibarMilestoneTrackerPoint extends Polymer.Element {
		static get is() {
			return 'gdq-omnibar-milestone-tracker-point';
		}

		static get properties() {
			return {
				align: {
					type: String,
					value: 'left',
					reflectToAttribute: true,
					observer: '_alignChanged'
				},
				amount: Number,
				dropTrailingZeroes: {
					type: Boolean,
					value: false
				}
			};
		}

		_alignChanged(newVal) {
			if (newVal !== 'center') {
				this.$.body.style.left = '';
			}

			const bodyRect = this.$.body.getBoundingClientRect();
			this.$.body.style.left = `${(bodyRect.width / -2) + 1.5}px`;
		}

		_calcDisplayAmount(amount) {
			return `$${this._formatAmount(amount / ONE_MILLION)}M`;
		}

		_formatAmount(amount) {
			let amountString = String(amount).substr(0, 4);

			if (this.dropTrailingZeroes) {
				while (
					(amountString.endsWith('0') || amountString.endsWith('.')) &&
					amountString.length > 1
				) {
					amountString = amountString.slice(0, -1);
				}
			}

			// Use the monospace version of the "1" character in the gdqpixel font.
			return amountString.replace(/1/ig, '\u00C0');
		}
	}

	customElements.define(GdqOmnibarMilestoneTrackerPoint.is, GdqOmnibarMilestoneTrackerPoint);
})();
