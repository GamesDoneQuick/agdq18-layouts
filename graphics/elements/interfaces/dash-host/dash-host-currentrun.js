(function () {
	'use strict';

	const checklistComplete = nodecg.Replicant('checklistComplete');
	const stopwatch = nodecg.Replicant('stopwatch');
	const currentRun = nodecg.Replicant('currentRun');

	/**
	 * @customElement
	 * @polymer
	 */
	class DashHostCurrentrun extends Polymer.MutableData(Polymer.Element) {
		static get is() {
			return 'dash-host-currentrun';
		}

		static get properties() {
			return {
				checklistComplete: {
					type: Boolean,
					value: false,
					reflectToAttribute: true
				},
				stopwatchTime: String,
				stopwatchResults: Array,
				runners: Array
			};
		}

		ready() {
			super.ready();

			checklistComplete.on('change', newVal => {
				this.checklistComplete = newVal;
			});

			currentRun.on('change', newVal => {
				this.$.currentRunName.innerHTML = newVal.name.replace('\\n', '<br/>').trim();
				this.runners = newVal.runners;
			});

			stopwatch.on('change', newVal => {
				this.stopwatchTime = newVal.time.formatted;
				this.stopwatchResults = newVal.results;
			});
		}

		isValidResult(result, index, runners) {
			return result && result !== null && runners[index] && runners[index].name;
		}

		_calcStatusText(newVal) {
			return newVal ? 'READY' : 'NOT READY';
		}

		_unionRunnersAndResults(runners, results) {
			if (!runners || !results) {
				return;
			}

			return runners.map((runner, index) => {
				return {runner, result: results[index]};
			});
		}

		_calcRunnerStatus(result) {
			if (result && result.time) {
				return result.time.formatted;
			}

			return 'Running';
		}
	}

	customElements.define(DashHostCurrentrun.is, DashHostCurrentrun);
})();
