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

		updatePosition() {
			if (this.align !== 'auto') {
				this.$.body.style.left = '';
				return;
			}

			const parentRect = this.parentNode.getBoundingClientRect();
			const lineRect = this.$.line.getBoundingClientRect();
			const bodyRect = this.$.body.getBoundingClientRect();

			const availableLeftSpace = lineRect.left - parentRect.left;
			const availableRightSpace = parentRect.right - lineRect.right;
			console.log('parentRect:', parentRect);
			console.log('lineRect:', lineRect);

			const centeredOverhang = (bodyRect.width / 2) - 1.5;
			const leftDefecit = Math.max(centeredOverhang - availableLeftSpace, 0);
			const rightDefecit = Math.max(centeredOverhang - availableRightSpace, 0);
			const finalLeft = -centeredOverhang + leftDefecit - rightDefecit;
			console.log('availableLeftSpace: %f, availableRightSpace: %f', availableLeftSpace, availableRightSpace);
			console.log('leftDefecit: %f, rightDefecit: %f, finalLeft: %f', leftDefecit, rightDefecit, finalLeft);

			this.$.body.style.left = `${finalLeft}px`;
		}

		_alignChanged() {
			this.updatePosition();
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
