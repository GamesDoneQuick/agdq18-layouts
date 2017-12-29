(function () {
	'use strict';

	const total = nodecg.Replicant('total');
	const currentRun = nodecg.Replicant('currentRun');
	const nextRun = nodecg.Replicant('nextRun');
	const currentLayout = nodecg.Replicant('gdq:currentLayout');
	const throwIncoming = nodecg.Replicant('interview:throwIncoming');
	const interviewStopwatch = nodecg.Replicant('interview:stopwatch');
	const checklistComplete = nodecg.Replicant('checklistComplete');
	const prizeModeRep = nodecg.Replicant('interview:showPrizesOnMonitor');

	class DashInterviewMonitor extends Polymer.MutableData(Polymer.Element) {
		static get is() {
			return 'dash-interview-monitor';
		}

		static get properties() {
			return {
				throwIncoming: {
					type: Boolean,
					value: false,
					reflectToAttribute: true
				},
				timeElapsed: {
					type: String
				},
				upNextRunName: String,
				prizeMode: {
					type: Boolean,
					value: false,
					reflectToAttribute: true
				}
			};
		}

		ready() {
			super.ready();

			this.$['total-amount'].displayValueTransform = displayValue => {
				return displayValue.toLocaleString('en-US', {
					maximumFractionDigits: 0
				});
			};
			total.on('change', newVal => {
				this.$['total-amount'].value = newVal.raw;
			});

			this.updateUpNextDisplay = this.updateUpNextDisplay.bind(this);
			currentLayout.on('change', this.updateUpNextDisplay);
			currentRun.on('change', this.updateUpNextDisplay);
			nextRun.on('change', this.updateUpNextDisplay);

			throwIncoming.on('change', newVal => {
				this.throwIncoming = newVal;
			});

			interviewStopwatch.on('change', newVal => {
				this.timeElapsed = newVal.time.formatted.split('.')[0];
			});

			checklistComplete.on('change', newVal => {
				if (newVal) {
					this.$.checklistStatus.style.backgroundColor = '#cfffcf';
					this.$.checklistStatus.innerText = 'DONE WITH SETUP';
				} else {
					this.$.checklistStatus.style.backgroundColor = '#ffe2e2';
					this.$.checklistStatus.innerText = 'STILL DOING SETUP';
				}
			});

			prizeModeRep.on('change', newVal => {
				this.prizeMode = newVal;
			});
		}

		updateUpNextDisplay() {
			let upNextRun = nextRun.value;

			if (currentLayout.value === 'break' || currentLayout.value === 'interview') {
				upNextRun = currentRun.value;
			}

			if (!upNextRun) {
				return;
			}

			this.upNextRunName = upNextRun.name.replace('\\n', ' ').trim();

			let concatenatedRunners;
			if (upNextRun.runners.length === 1) {
				concatenatedRunners = upNextRun.runners[0].name;
			} else {
				concatenatedRunners = upNextRun.runners.slice(1).reduce((prev, curr, index, array) => {
					if (index === array.length - 1) {
						return `${prev} &<br/>${curr.name}`;
					}

					return `${prev},<br/>${curr.name}`;
				}, upNextRun.runners[0].name);
			}
			this.$.nextRunners.innerHTML = concatenatedRunners;
		}

		_calcSelectedPage(prizeMode) {
			return prizeMode ? 1 : 0;
		}
	}

	customElements.define(DashInterviewMonitor.is, DashInterviewMonitor);
})();
