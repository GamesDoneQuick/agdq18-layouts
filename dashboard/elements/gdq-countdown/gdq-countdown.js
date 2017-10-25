(function () {
	'use strict';

	const countdownRunning = nodecg.Replicant('countdownRunning');
	const countdown = nodecg.Replicant('countdown');

	class GdqCountdown extends Polymer.Element {
		static get is() {
			return 'gdq-countdown';
		}

		static get properties() {
			return {};
		}

		ready() {
			super.ready();

			countdown.on('change', newVal => {
				this.$.timeInput.setMS(newVal.minutes, newVal.seconds);
			});

			countdownRunning.on('change', newVal => {
				if (newVal) {
					this.$.countdownContainer.setAttribute('disabled', 'true');
					this.$.start.setAttribute('disabled-running', 'true');
					this.$.stop.removeAttribute('disabled');
				} else {
					this.$.countdownContainer.removeAttribute('disabled');
					this.$.start.removeAttribute('disabled-running');
					this.$.stop.setAttribute('disabled', 'true');
				}

				this.checkStartButton();
			});
		}

		start() {
			nodecg.sendMessage('startCountdown', this.$.timeInput.value);
		}

		stop() {
			nodecg.sendMessage('stopCountdown');
		}

		_handleTimeInvalidChanged(e) {
			if (e.detail.value) {
				this.$.start.setAttribute('disabled-invalid', 'true');
			} else {
				this.$.start.removeAttribute('disabled-invalid');
			}

			this.checkStartButton();
		}

		/**
		 * Enables or disables the timer start button based on some criteria.
		 * @returns {undefined}
		 */
		checkStartButton() {
			if (this.$.start.hasAttribute('disabled-invalid') || this.$.start.hasAttribute('disabled-running')) {
				this.$.start.setAttribute('disabled', 'true');
			} else {
				this.$.start.removeAttribute('disabled');
			}
		}
	}

	customElements.define(GdqCountdown.is, GdqCountdown);
})();
