(function () {
	'use strict';

	const currentIntermission = nodecg.Replicant('currentIntermission');
	const currentRun = nodecg.Replicant('currentRun');
	const schedule = nodecg.Replicant('schedule');
	const stopwatch = nodecg.Replicant('stopwatch');

	class UiRundown extends Polymer.MutableData(Polymer.Element) {
		static get is() {
			return 'ui-rundown';
		}

		static get properties() {
			return {
				schedule: {
					type: Object
				},
				remainderItems: Array,
				currentItems: Array,
				maxRunsToShow: {
					type: Number,
					value: 4,
					observer: '_maxRunsToShowChanged'
				}
			};
		}

		ready() {
			super.ready();
			this._debounceUpdateScheduleSlice = this._debounceUpdateScheduleSlice.bind(this);
			this._updateScheduleSlice = this._updateScheduleSlice.bind(this);

			currentIntermission.on('change', (newVal, oldVal, operations) => {
				const ignore = operations ?
					operations.every(operation => {
						return operation.path.endsWith('/state');
					}) :
					false;

				if (ignore) {
					return;
				}

				this._debounceUpdateScheduleSlice();
			});
			currentRun.on('change', this._debounceUpdateScheduleSlice);
			schedule.on('change', this._debounceUpdateScheduleSlice);
			stopwatch.on('change', (newVal, oldVal) => {
				if (!oldVal || newVal.state !== oldVal.state || newVal.time.raw < oldVal.time.raw) {
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
				currentIntermission.status !== 'declared' ||
				!schedule.value) {
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
			let endIndex;
			let lastRunOrder = currentRun.value.order;
			schedule.value.slice(startIndex).some((item, index) => {
				if (numFoundRuns < this.maxRunsToShow) {
					if (item.type === 'run') {
						lastRunOrder = item.order;
						numFoundRuns++;
						if (numFoundRuns >= this.maxRunsToShow) {
							endIndex = index;
							return false;
						}
					}

					return false;
				}

				if (item.type !== 'run' && item.order === lastRunOrder) {
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

		_maxRunsToShowChanged() {
			this._debounceUpdateScheduleSlice();
		}

		_showTooltip(e) {
			const notes = e.model.item.notes;
			if (!notes || notes.trim().length <= 0) {
				return;
			}

			this.$['tooltip-content'].innerHTML = notes
				.replace(/\r\n/g, '<br/>')
				.replace(/\n/g, '<br/>');

			const thisRect = this.getBoundingClientRect();
			const itemRect = e.target.getBoundingClientRect();
			const tooltipRect = this.$['tooltip-content'].getBoundingClientRect();
			const offset = -4;

			this.$.tooltip.style.opacity = 1;
			this.$.tooltip.style.top = `${itemRect.top - thisRect.top - tooltipRect.height + offset}px`;
		}

		_hideTooltip() {
			this.$.tooltip.style.opacity = 0;
		}
	}

	customElements.define(UiRundown.is, UiRundown);
})();
