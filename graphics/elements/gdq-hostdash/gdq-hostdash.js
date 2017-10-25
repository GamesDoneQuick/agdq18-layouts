(function () {
	'use strict';

	const METROID_BID_ID = 5744;
	const EVENT_START_TIMESTAMP = 1499013000000;
	const allBids = nodecg.Replicant('allBids');
	const checklistComplete = nodecg.Replicant('checklistComplete');
	const stopwatch = nodecg.Replicant('stopwatch');
	const currentRun = nodecg.Replicant('currentRun');

	class GdqHostDashboard extends Polymer.MutableData(Polymer.Element) {
		static get is() {
			return 'gdq-hostdash';
		}

		static get properties() {
			return {
				currentTime: {
					type: String
				},
				currentRun: {
					type: Object
				},
				elapsedTime: {
					type: String
				},
				metroidBid: {
					type: Object,
					observer: 'metroidBidChanged'
				},
				saveTheAnimalsTotal: {
					type: Object
				},
				killTheAnimalsTotal: {
					type: Object
				},
				bidFilterString: {
					type: String,
					value: ''
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

			allBids.on('change', newVal => {
				const metroidBid = newVal.find(bid => bid.id === METROID_BID_ID);
				this.metroidBid = metroidBid ? metroidBid : null;
			});

			checklistComplete.on('change', newVal => {
				if (newVal) {
					this.$.checklistStatus.style.backgroundColor = '#cfffcf';
					this.$.checklistStatus.innerText = 'READY TO START';
				} else {
					this.$.checklistStatus.style.backgroundColor = '#ffe2e2';
					this.$.checklistStatus.innerText = 'NOT READY YET';
				}
			});

			currentRun.on('change', newVal => {
				this.$['currentRun-name'].innerHTML = newVal.name.replace('\\n', '<br/>').trim();
				this.runners = newVal.runners;
			});

			stopwatch.on('change', newVal => {
				this.stopwatchState = newVal.state;
				this.stopwatchTime = newVal.formatted;
				this.stopwatchResults = newVal.results;
			});
		}

		metroidBidChanged(newVal) {
			if (newVal) {
				const saveOpt = newVal.options.find(opt => opt.name.toLowerCase().indexOf('save') >= 0);
				const killOpt = newVal.options.find(opt => opt.name.toLowerCase().indexOf('kill') >= 0);
				this.saveTheAnimalsTotal = {
					formatted: saveOpt.total,
					raw: saveOpt.rawTotal
				};
				this.killTheAnimalsTotal = {
					formatted: killOpt.total,
					raw: killOpt.rawTotal
				};
			} else {
				this.saveTheAnimalsTotal = {
					formatted: '?',
					raw: 0
				};
				this.killTheAnimalsTotal = {
					formatted: '?',
					raw: 0
				};
			}

			if (this.saveTheAnimalsTotal.raw > this.killTheAnimalsTotal.raw) {
				this.$['metroid-save'].setAttribute('ahead', 'true');
				this.$['metroid-kill'].removeAttribute('ahead');
			} else if (this.saveTheAnimalsTotal.raw < this.killTheAnimalsTotal.raw) {
				this.$['metroid-save'].removeAttribute('ahead');
				this.$['metroid-kill'].setAttribute('ahead', 'true');
			} else {
				this.$['metroid-save'].removeAttribute('ahead');
				this.$['metroid-kill'].removeAttribute('ahead');
			}
		}

		calcRunnersString(runners) {
			let concatenatedRunners;
			if (runners.length === 1) {
				concatenatedRunners = runners[0].name;
			} else {
				concatenatedRunners = runners.slice(1).reduce((prev, curr, index, array) => {
					if (index === array.length - 1) {
						return `${prev} & ${curr.name}`;
					}

					return `${prev}, ${curr.name}`;
				}, runners[0].name);
			}
			return concatenatedRunners;
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

		calcMetroidStateText(bidState) {
			if (bidState && bidState.toLowerCase() === 'opened') {
				this.$['metroid-state'].style.backgroundColor = '#CFFFD0';
				return 'INCENTIVE OPEN';
			}

			this.$['metroid-state'].style.backgroundColor = '#FFE2E4';
			return 'INCENTIVE CLOSED';
		}

		calcMetroidAheadText(saveOrKill, saveTheAnimalsTotal, killTheAnimalsTotal) {
			if (!saveOrKill || !saveTheAnimalsTotal || !killTheAnimalsTotal) {
				return;
			}

			const diff = Math.abs(saveTheAnimalsTotal.raw - killTheAnimalsTotal.raw).toLocaleString('en-US', {
				maximumFractionDigits: 2,
				style: 'currency',
				currency: 'USD'
			});

			if (saveOrKill === 'save') {
				if (saveTheAnimalsTotal.raw > killTheAnimalsTotal.raw) {
					return `Ahead by ${diff}`;
				} else if (killTheAnimalsTotal.raw > saveTheAnimalsTotal.raw) {
					return '---';
				}
				return 'TIED';
			} else if (saveOrKill === 'kill') {
				if (killTheAnimalsTotal.raw > saveTheAnimalsTotal.raw) {
					return `Ahead by ${diff}`;
				} else if (saveTheAnimalsTotal.raw > killTheAnimalsTotal.raw) {
					return '---';
				}
				return 'TIED';
			}

			throw new Error(`Unexpected calcAheadText first argument: "${saveOrKill}". Acceptable values are "save" and "kill".`);
		}

		calcRunnerName(runners, index) {
			if (!runners) {
				return;
			}

			if (index > runners.length - 1) {
				return '';
			}

			return runners[index].name;
		}

		isValidResult(result, index, runners) {
			return result && result !== null && runners[index] && runners[index].name;
		}
	}

	customElements.define(GdqHostDashboard.is, GdqHostDashboard);
})();
