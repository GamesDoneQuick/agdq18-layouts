(function () {
	'use strict';

	const stopwatch = nodecg.Replicant('stopwatch');
	const currentRun = nodecg.Replicant('currentRun');
	const checklistComplete = nodecg.Replicant('checklistComplete');

	class GdqTimekeeper extends Polymer.Element {
		static get is() {
			return 'gdq-timekeeper';
		}

		static get properties() {
			return {
				checklistIncomplete: {
					type: Boolean,
					reflectToAttribute: true,
					value: false
				},
				state: {
					type: String,
					reflectToAttribute: true
				},
				paused: {
					type: Boolean,
					reflectToAttribute: true
				},
				results: Array,
				coop: Boolean,
				runners: Array,
				time: String
			};
		}

		ready() {
			super.ready();
			stopwatch.on('change', this.stopwatchChanged.bind(this));
			currentRun.on('change', newVal => {
				const runners = newVal.runners.slice(0);
				runners.length = 4;
				for (let i = 0; i < 4; i++) {
					runners[i] = runners[i] || false;
				}
				this.runners = runners;
				this.coop = newVal.coop;
			});
			checklistComplete.on('change', newVal => {
				this.checklistIncomplete = !newVal;
			});
		}

		stopwatchChanged(newVal) {
			this.state = newVal.state;
			this.time = newVal.time.formatted;
			this.results = newVal.results.slice(0);
			this.notStarted = newVal.state === 'not_started';
			this.paused = newVal.state === 'paused';
		}

		confirmReset() {
			this.$.resetDialog.open();
		}

		startTimer() {
			nodecg.sendMessage('startTimer');
		}

		stopTimer() {
			nodecg.sendMessage('stopTimer');
		}

		resetTimer() {
			nodecg.sendMessage('resetTimer');
		}

		calcStartDisabled(checklistIncomplete, state) {
			return checklistIncomplete || state === 'running' || state === 'finished';
		}

		calcStartText(state) {
			switch (state) {
				case 'paused':
					return 'Resume';
				default:
					return 'Start';
			}
		}

		calcPauseDisabled(state) {
			return state !== 'running';
		}

		editMasterTime() {
			this.$['editDialog-text'].textContent = `Enter a new master time.`;
			this.$.editDialog.setAttribute('data-index', 'master');
			this.$['editDialog-input'].value = this.time;
			this.$.editDialog.open();
		}

		saveEditedTime() {
			nodecg.sendMessage('editTime', {
				index: this.$.editDialog.getAttribute('data-index'),
				newTime: this.$['editDialog-input'].value
			});
			this.$['editDialog-input'].value = '';
		}

		editRunnerTime(e) {
			this.$['editDialog-text'].innerHTML = `Enter a new final time for <b>${e.model.runner.name}.</b>`;
			this.$.editDialog.setAttribute('data-index', e.model.index);
			this.$['editDialog-input'].value = this.results[e.model.index].time.formatted;
			this.$.editDialog.open();
		}

		editCoopTime() {
			this.$['editDialog-text'].innerHTML = `Enter a new final time for <b>all runners.</b>`;
			this.$.editDialog.setAttribute('data-index', 0);
			this.$['editDialog-input'].value = this.results[0].time.formatted;
			this.$.editDialog.open();
		}
	}

	customElements.define(GdqTimekeeper.is, GdqTimekeeper);
})();
