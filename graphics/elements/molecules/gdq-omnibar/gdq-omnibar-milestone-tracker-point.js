(function () {
	'use strict';

	const ONE_MILLION = 1000000;
	const ONE_THOUSAND = 1000;

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
				amount: Number
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
			if (amount >= ONE_MILLION) {
				return `$${this._formatAmount(amount / ONE_MILLION)}M`;
			}

			if (amount >= ONE_THOUSAND) {
				return `$${this._formatAmount(amount / ONE_THOUSAND)}K`;
			}

			return `$${this._formatAmount(amount)}`;
		}

		_formatAmount(amount) {
			let amountString = amount.toFixed(2);
			while (
				(amountString.endsWith('0') || amountString.endsWith('.')) &&
				amountString.length > 1
			) {
				amountString = amountString.slice(0, -1);
			}

			return amountString;
		}
	}

	customElements.define(GdqOmnibarMilestoneTrackerPoint.is, GdqOmnibarMilestoneTrackerPoint);
})();
