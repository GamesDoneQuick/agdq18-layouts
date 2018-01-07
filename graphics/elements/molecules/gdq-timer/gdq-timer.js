(function () {
	'use strict';

	const stopwatch = nodecg.Replicant('stopwatch');

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
				hours: Number,
				minutes: Number,
				seconds: Number,
				milliseconds: Number
			};
		}

		ready() {
			super.ready();

			const timerTL = new TimelineLite({autoRemoveChildren: true});

			stopwatch.on('change', (newVal, oldVal) => {
				this.hours = newVal.time.hours;
				this.minutes = newVal.time.minutes;
				this.seconds = newVal.time.seconds;
				this.milliseconds = newVal.time.milliseconds;

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

					if (newVal.state === 'finished' && oldVal.state !== 'finished') {
						timerTL.from(this.$.startFlash, 1, {
							opacity: 1,
							ease: Power2.easeIn
						});
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

		_lessThanEqZero(number) {
			return number <= 0;
		}

		_padTime(number) {
			return String(number).padStart(2, '0');
		}

		_formatMilliseconds(milliseconds) {
			return Math.floor(milliseconds / 100);
		}
	}

	customElements.define(GdqTimer.is, GdqTimer);
})();
