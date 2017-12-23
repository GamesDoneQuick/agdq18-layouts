/* global Random */
(function () {
	'use strict';

	/**
	 * @customElement
	 * @polymer
	 */
	class GdqBreakTopFrame extends Polymer.Element {
		static get is() {
			return 'gdq-break-top-frame';
		}

		ready() {
			super.ready();
			this.$.totalTextAmount.displayValueTransform = this._totalDisplayValueTransform.bind(this);

			nodecg.readReplicant('total', totalVal => {
				this.$.totalTextAmount.value = totalVal.raw;
				nodecg.listenFor('donation', this._handleDonation.bind(this));
			});

			nodecg.listenFor('total:manuallyUpdated', totalVal => {
				this.$.totalTextAmount.value = totalVal.raw;
			});
		}

		donationText(formattedAmount, rawAmount) {
			const div = document.createElement('div');
			div.classList.add('donationText');
			div.innerText = formattedAmount;

			if (rawAmount >= 500) {
				div.style.backgroundColor = '#FF68B9';
			} else if (rawAmount >= 100) {
				div.style.backgroundColor = '#FFFBBD';
			} else if (rawAmount >= 20) {
				div.style.backgroundColor = '#00ffff';
			} else {
				div.style.backgroundColor = 'white';
			}

			this.$.totalText.appendChild(div);
			div.style.left = `${randomInt(0, this.$.totalText.clientWidth - div.clientWidth)}px`;
			div.style.bottom = `${randomInt(2, 8)}px`;

			const tl = new TimelineLite();

			tl.to(div, 0.1834, {
				clipPath: 'inset(0 0%)',
				ease: Power1.easeIn
			});

			tl.addLabel('exit', rawAmount >= 500 ? 1 : 0.067);
			tl.to(div, 0.934, {
				y: -21,
				ease: Power1.easeIn
			}, 'exit');
			tl.to(div, 0.5167, {
				opacity: 0,
				ease: Power1.easeIn
			}, 'exit+=0.4167');

			tl.call(() => {
				div.remove();
			});
		}

		_handleDonation({amount, rawAmount, rawNewTotal}) {
			this.donationText(amount, rawAmount);
			this.$.totalTextAmount.value = rawNewTotal;
		}

		_totalDisplayValueTransform(displayValue) {
			return displayValue.toLocaleString('en-US', {
				maximumFractionDigits: 0
			}).replace(/1/ig, '\u00C0');
		}
	}

	customElements.define(GdqBreakTopFrame.is, GdqBreakTopFrame);

	/**
	 * Generates a random integer.
	 * @param {Number} min - The minimum number, inclusive.
	 * @param {Number} max - The maximmum number, inclusive.
	 * @returns {Number} - A random number between min and max, inclusive.
	 */
	function randomInt(min, max) {
		return Random.integer(min, max)(Random.engines.browserCrypto);
	}
})();
