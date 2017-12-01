(function () {
	'use strict';

	const stopwatch = nodecg.Replicant('stopwatch');

	class GdqTimer extends Polymer.Element {
		static get is() {
			return 'gdq-timer';
		}

		static get properties() {
			return {
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

		ready() {
			super.ready();

			const timerTL = new TimelineLite({autoRemoveChildren: true});

			stopwatch.on('change', (newVal, oldVal) => {
				this.time = newVal.time.formatted;
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
					}
				}

				if (newVal.state === 'stopped' && newVal.time.raw !== 0) {
					this.paused = true;
				} else if (newVal.state === 'finished') {
					this.finished = true;
				} else {
					this.paused = false;
					this.finished = false;
				}

				if (newVal.state !== 'running') {
					timerTL.clear();
					this.$.startFlash.style.opacity = 0;
				}
			});
		}
	}

	customElements.define(GdqTimer.is, GdqTimer);
})();
