(function () {
	'use strict';

	const EVENT_START_TIMESTAMP = 1515434400000;

	class DashHost extends Polymer.MutableData(Polymer.Element) {
		static get is() {
			return 'dash-host';
		}

		static get properties() {
			return {
				currentTime: {
					type: String
				},
				currentRun: {
					type: Object
				},
				runners: Array,
				elapsedTime: {
					type: String
				},
				stopwatchResults: Array,
				stopwatchTime: String,
				saveTheAnimalsTotal: {
					type: Object
				},
				killTheAnimalsTotal: {
					type: Object
				},
				selectedBidsAndPrizesTab: {
					type: Number,
					value: 0
				}
			};
		}

		connectedCallback() {
			super.connectedCallback();

			this.updateCurrentTime = this.updateCurrentTime.bind(this);
			this.updateCurrentTime();
			setInterval(this.updateCurrentTime, 1000);

			this.updateTimeElapsed = this.updateTimeElapsed.bind(this);
			this.updateTimeElapsed();
			setInterval(this.updateTimeElapsed, 1000);
		}

		updateCurrentTime() {
			const date = new Date();
			this.currentTime = date.toLocaleTimeString('en-US', {hour12: true});
		}

		updateTimeElapsed() {
			const nowTimestamp = Date.now();
			let millisecondsElapsed = nowTimestamp - EVENT_START_TIMESTAMP;
			let eventHasStarted = true;
			if (millisecondsElapsed < 0) {
				eventHasStarted = false;
				millisecondsElapsed = Math.abs(millisecondsElapsed);
			}

			const days = millisecondsElapsed / 8.64e7 | 0;
			const hours = parseInt((millisecondsElapsed / (1000 * 60 * 60)) % 24, 10);
			const minutes = parseInt((millisecondsElapsed / (1000 * 60)) % 60, 10);
			let timeString;

			if (eventHasStarted) {
				if (hours > 0) {
					timeString = `${(days * 24) + hours} HOURS`;
				} else {
					timeString = `${minutes} MINUTES`;
				}

				timeString += ' ELAPSED';
			} else {
				timeString = 'SHOW STARTS IN ';
				if (days > 0) {
					timeString += `${days} DAYS, ${hours} HOURS & ${minutes} MINUTES`;
				} else if (hours > 0) {
					timeString += `${hours} HOURS & ${minutes} MINUTES`;
				} else {
					timeString += `${minutes} MINUTES`;
				}
			}

			this.elapsedTime = timeString;
		}
	}

	customElements.define(DashHost.is, DashHost);
})();
