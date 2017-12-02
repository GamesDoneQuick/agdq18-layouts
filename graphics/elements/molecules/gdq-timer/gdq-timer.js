(function () {
	'use strict';

	const stopwatch = nodecg.Replicant('stopwatch');
	const colonRegex = /:/g;
	const decimalPointRegex = /\./;
	const decimalValueRegex = /[0-9]*$/;

	class GdqTimer extends Polymer.Element {
		static get is() {
			return 'gdq-timer';
		}

		static get properties() {
			return {
				notStarted: {
					type: Boolean,
					reflectToAttribute: true
				},
				paused: {
					type: Boolean,
					observer: 'pausedChanged',
					reflectToAttribute: true
				},
				finished: {
					type: Boolean,
					observer: 'finishedChanged',
					reflectToAttribute: true
				},
				time: String
			};
		}

		static formatTimeString(timeString) {
			timeString = timeString.replace(colonRegex, '<span class="colon">:</span>');
			timeString = timeString.replace(decimalPointRegex, '<span class="decimalPoint">.</span>');
			timeString = timeString.replace(decimalValueRegex, match => `<span class="decimalValue">${match}</span>`);
			return timeString;
		}

		ready() {
			super.ready();

			const timerTL = new TimelineLite({autoRemoveChildren: true});

			stopwatch.on('change', (newVal, oldVal) => {
				this.time = GdqTimer.formatTimeString(newVal.time.formatted);
				this.$.binaryClock.hours = newVal.time.hours;
				this.$.binaryClock.minutes = newVal.time.minutes;
				this.$.binaryClock.seconds = newVal.time.seconds;
				this.$.binaryClock.milliseconds = newVal.time.milliseconds;

				if (oldVal) {
					if (newVal.state === 'running' && oldVal.state !== 'running') {
						timerTL.from(this.$.startFlash, 1, {
							opacity: 1,
							ease: Power2.easeIn
						});
					} else if (newVal.state !== 'running' && newVal.state !== oldVal.state) {
						timerTL.clear();
						this.$.startFlash.style.opacity = 0;
					}
				}

				this.notStarted = newVal.state === 'not_started';
				this.paused = newVal.state === 'paused';
				this.finished = newVal.state === 'finished';
			});
		}

		pausedChanged(newVal) {
			if (newVal && this.finished) {
				this.finished = false;
			}
		}

		finishedChanged(newVal) {
			if (newVal && this.paused) {
				this.paused = false;
			}
		}
	}

	customElements.define(GdqTimer.is, GdqTimer);
})();
