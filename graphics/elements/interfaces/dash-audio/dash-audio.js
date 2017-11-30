(function () {
	'use strict';

	const checklist = nodecg.Replicant('checklist');
	const checklistComplete = nodecg.Replicant('checklistComplete');
	const currentRun = nodecg.Replicant('currentRun');
	const stopwatch = nodecg.Replicant('stopwatch');

	class DashAudio extends Polymer.MutableData(Polymer.Element) {
		static get is() {
			return 'dash-audio';
		}

		static get properties() {
			return {
				audioEngineerDuties: Array,
				runners: Array,
				stopwatchTime: String
			};
		}

		ready() {
			super.ready();

			checklist.on('change', newVal => {
				this.audioEngineerDuties = newVal.audioEngineerDuties;
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
				this.stopwatchTime = newVal.time.formatted;
				this.stopwatchResults = newVal.results;
			});

			this._checkboxChanged = this._checkboxChanged.bind(this);
			this.addEventListener('change', this._checkboxChanged);
		}

		calcRunnersString(runners) {
			let concatenatedRunners = runners[0].name;
			if (runners.length >= 1) {
				concatenatedRunners = runners.slice(1).reduce((prev, curr, index, array) => {
					if (index === array.length - 1) {
						return `${prev} & ${curr.name}`;
					}

					return `${prev}, ${curr.name}`;
				}, concatenatedRunners);
			}
			return concatenatedRunners;
		}

		_checkboxChanged(e) {
			const target = e.path[0];
			const category = target.getAttribute('category');
			const name = target.innerText.trim();
			checklist.value[category].find(task => {
				if (task.name === name) {
					task.complete = target.checked;
					return true;
				}

				return false;
			});
		}
	}

	customElements.define(DashAudio.is, DashAudio);
})();
