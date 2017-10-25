(function () {
	'use strict';

	const NUM_RUNS_TO_SHOW_IN_RUNDOWN = 4;
	const currentIntermission = nodecg.Replicant('currentIntermission');
	const currentRun = nodecg.Replicant('currentRun');
	const schedule = nodecg.Replicant('schedule');
	const stopwatch = nodecg.Replicant('stopwatch');

	class GdqRundown extends Polymer.MutableData(Polymer.Element) {
		static get is() {
			return 'gdq-rundown';
		}

		static get properties() {
			return {
				schedule: {
					type: Object
				}
			};
		}

		ready() {
			super.ready();
			this._debounceUpdateScheduleSlice = this._debounceUpdateScheduleSlice.bind(this);
			this._updateScheduleSlice = this._updateScheduleSlice.bind(this);

			currentIntermission.on('change', this._debounceUpdateScheduleSlice);
			currentRun.on('change', this._debounceUpdateScheduleSlice);
			schedule.on('change', this._debounceUpdateScheduleSlice);
			stopwatch.on('change', (newVal, oldVal) => {
				if (!oldVal || newVal.state !== oldVal.state || newVal.raw < oldVal.raw) {
					return this._debounceUpdateScheduleSlice();
				}
			});
		}

		_debounceUpdateScheduleSlice() {
			this._updateScheduleSliceDebouncer = Polymer.Debouncer.debounce(
				this._updateScheduleSliceDebouncer,
				Polymer.Async.timeOut.after(10),
				this._updateScheduleSlice
			);
		}

		_updateScheduleSlice() {
			if (currentRun.status !== 'declared' ||
				schedule.status !== 'declared' ||
				stopwatch.status !== 'declared' ||
				currentIntermission.status !== 'declared') {
				return;
			}

			let currentItems = [currentRun.value];
			if (currentIntermission.value.preOrPost === 'pre') {
				currentItems = currentIntermission.value.content.concat(currentItems);
			} else {
				currentItems = currentItems.concat(currentIntermission.value.content);
			}

			// Start after whatever the last item was in currentItems.
			const lastCurrentItem = currentItems[currentItems.length - 1];
			const startIndex = schedule.value.findIndex(item => {
				return item.id === lastCurrentItem.id && item.type === lastCurrentItem.type;
			}) + 1;
			let numFoundRuns = 0;
			let endIndex = startIndex;
			let lastRunOrder = currentRun.value.order;
			schedule.value.slice(startIndex).some((item, index) => {
				if (numFoundRuns < NUM_RUNS_TO_SHOW_IN_RUNDOWN) {
					if (item.type === 'run') {
						lastRunOrder = item.order;
						numFoundRuns++;
						if (numFoundRuns >= NUM_RUNS_TO_SHOW_IN_RUNDOWN) {
							endIndex = index;
							return false;
						}
					}

					return false;
				} else if (item.type !== 'run' && item.order === lastRunOrder) {
					endIndex = index;
					return false;
				}

				return true;
			});

			this.currentItems = currentItems;
			this.remainderItems = typeof endIndex === 'number' ?
				schedule.value.slice(startIndex, startIndex + endIndex + 1) :
				schedule.value.slice(startIndex);
		}
	}

	customElements.define(GdqRundown.is, GdqRundown);
})();
