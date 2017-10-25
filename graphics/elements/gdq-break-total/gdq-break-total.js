class GdqBreakTotal extends Polymer.Element {
	static get is() {
		return 'gdq-break-total';
	}

	static get properties() {
		return {
			totalInCents: {
				type: Number,
				observer: 'totalInCentsChanged'
			},
			_totalInitialized: {
				type: Boolean,
				value: false
			}
		};
	}

	ready() {
		super.ready();
		this.$['total-amount'].rawCents = 0;
		nodecg.readReplicant('total', totalVal => {
			this.totalInCents = Math.round(totalVal.raw * 100);
			nodecg.listenFor('donation', this.handleDonation.bind(this));
		});

		nodecg.listenFor('total:manuallyUpdated', totalVal => {
			this.totalInCents = Math.round(totalVal.raw * 100);
		});
	}

	handleDonation({amount, rawNewTotal}) {
		const newTotalInCents = Math.round(rawNewTotal * 100);
		this.donationText(amount);
		this.totalInCents = newTotalInCents;
	}

	donationText(formattedAmount) {
		const div = document.createElement('div');
		div.classList.add('donationText');
		div.innerText = formattedAmount;
		div.style.left = `${randomInt(0, this.$.total.clientWidth)}px`;
		this.$.total.appendChild(div);

		const tl = new TimelineLite();

		tl.to(div, 1, {
			y: -32,
			ease: Power1.easeOut
		}, 0);

		tl.to(div, 1, {
			opacity: 0,
			ease: Power1.easeIn
		}, 0);

		tl.call(() => {
			this.$.total.removeChild(div);
		});
	}

	totalInCentsChanged(newCents) {
		if (!this._totalInitialized) {
			this._totalInitialized = true;

			const dollars = newCents / 100;
			this.$['total-amount'].rawCents = newCents;
			this.$['total-amount'].textContent = dollars.toLocaleString('en-US', {
				maximumFractionDigits: 0
			}).replace(/1/ig, '\u00C0');
			return;
		}

		const TIME_PER_DOLLAR = 0.03;
		const deltaDollars = (newCents - this.$['total-amount'].rawCents) / 100;
		const duration = Math.min(deltaDollars * TIME_PER_DOLLAR, 3);
		TweenLite.to(this.$['total-amount'], duration, {
			rawCents: newCents,
			ease: Power2.easeOut,
			onUpdate() {
				const dollars = this.$['total-amount'].rawCents / 100;
				this.$['total-amount'].textContent = dollars.toLocaleString('en-US', {
					maximumFractionDigits: 0
				}).replace(/1/ig, '\u00C0');
			},
			onUpdateScope: this
		});
	}
}

customElements.define(GdqBreakTotal.is, GdqBreakTotal);

/**
 * Generates a random integer.
 * @param {Number} min - The minimum number, inclusive.
 * @param {Number} max - The maximmum number, inclusive.
 * @returns {Number} - A random number between min and max, inclusive.
 */
function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}
