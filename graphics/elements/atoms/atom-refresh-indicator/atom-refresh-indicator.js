/**
 * @customElement
 * @polymer
 */
class AtomRefreshIndicator extends Polymer.Element {
	static get is() {
		return 'atom-refresh-indicator';
	}

	static get properties() {
		return {
			indeterminate: {
				type: Boolean,
				value: true,
				reflectToAttribute: true,
				observer: '_indeterminateChanged'
			},
			timeUntilRefresh: {
				type: String,
				value: ':??'
			}
		};
	}

	startCountdown(seconds) {
		this.indeterminate = false;
		this.stopCountdown();
		this.$['meter-fill'].style.transform = '';

		const startTimestamp = Date.now();
		this._countdownInterval = setInterval(() => {
			const nowTimestamp = Date.now();
			const millisecondsElapsed = nowTimestamp - startTimestamp;
			const secondsRemaining = seconds - Math.ceil(millisecondsElapsed / 1000);
			const percentElapsed = Math.min(millisecondsElapsed / (seconds * 1000), 1) * 100;

			this.$['meter-fill'].style.transform = `translateX(-${percentElapsed}%)`;
			this.timeUntilRefresh = `:${String(secondsRemaining).padStart(2, '0')}`;

			if (secondsRemaining <= 0) {
				clearInterval(this._countdownInterval);
				this.indeterminate = true;
			}
		}, 1 / 60);
	}

	stopCountdown() {
		if (this._countdownInterval) {
			clearInterval(this._countdownInterval);
		}
	}

	_indeterminateChanged(newVal) {
		if (newVal) {
			this.stopCountdown();
			this.timeUntilRefresh = ':00';
		}
	}
}

customElements.define(AtomRefreshIndicator.is, AtomRefreshIndicator);
