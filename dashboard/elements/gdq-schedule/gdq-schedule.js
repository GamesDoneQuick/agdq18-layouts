(function () {
	'use strict';

	const canSeekSchedule = nodecg.Replicant('canSeekSchedule');
	const currentRun = nodecg.Replicant('currentRun');
	const nextRun = nodecg.Replicant('nextRun');
	const schedule = nodecg.Replicant('schedule');

	/**
	 * @customElement
	 * @polymer
	 */
	class GdqSchedule extends Polymer.Element {
		static get is() {
			return 'gdq-schedule';
		}

		ready() {
			super.ready();

			canSeekSchedule.on('change', () => {
				this._checkButtons();
			});

			schedule.on('change', newVal => {
				if (!newVal) {
					return;
				}

				this.$.typeahead.items = newVal
					.filter(item => item.type === 'run')
					.map(speedrun => speedrun.name);
				this._checkButtons();
			});

			currentRun.on('change', newVal => {
				if (!newVal) {
					return;
				}

				this.$.currentRun.setRun(newVal);
				this._checkButtons();
			});

			nextRun.on('change', newVal => {
				// Disable "next" button if at end of schedule
				if (newVal) {
					this.$.nextRun.setRun(newVal);
					this.$.editNext.removeAttribute('disabled');
				} else {
					this.$.nextRun.setRun({});
					this.$.editNext.setAttribute('disabled', 'true');
				}

				this._checkButtons();
			});
		}

		/**
		 * Takes the current value of the typeahead and loads that as the current speedrun.
		 * Shows a helpful error toast if no matching speedrun could be found.
		 * @returns {undefined}
		 */
		takeTypeahead() {
			if (!this.$.typeahead.value) {
				return;
			}

			const nameToFind = this.$.typeahead.value;

			// Find the run based on the name.
			const matched = schedule.value.some(run => {
				if (run.type !== 'run') {
					return false;
				}

				if (run.name.toLowerCase() === nameToFind.toLowerCase()) {
					this._pendingSetCurrentRunByOrderMessageResponse = true;
					this._checkButtons();
					nodecg.sendMessage('setCurrentRunByOrder', run.order, () => {
						this._pendingSetCurrentRunByOrderMessageResponse = false;
						this.$.typeahead.value = '';
						this.$.typeahead._suggestions = [];
						this._checkButtons();
					});
					return true;
				}

				return false;
			});

			if (!matched) {
				this.$.toast.show(`Could not find speedrun with name "${nameToFind}".`);
			}
		}

		fetchLatestSchedule() {
			this.$.fetchLatestSchedule.setAttribute('disabled', 'true');
			nodecg.sendMessage('updateSchedule', (err, updated) => {
				this.$.fetchLatestSchedule.removeAttribute('disabled');

				if (err) {
					nodecg.log.warn(err.message);
					this.$.toast.show('Error updating schedule. Check console.');
					return;
				}

				if (updated) {
					nodecg.log.info('Schedule successfully updated');
					this.$.toast.show('Successfully updated schedule.');
				} else {
					nodecg.log.info('Schedule unchanged, not updated');
					this.$.toast.show('Schedule unchanged, not updated.');
				}
			});
		}

		next() {
			this._pendingNextRunMessageResponse = true;
			this._checkButtons();
			nodecg.sendMessage('nextRun', () => {
				this._pendingNextRunMessageResponse = false;
				this._checkButtons();
			});
		}

		previous() {
			this._pendingPreviousRunMessageResponse = true;
			this._checkButtons();
			nodecg.sendMessage('previousRun', () => {
				this._pendingPreviousRunMessageResponse = false;
				this._checkButtons();
			});
		}

		editCurrent() {
			const editor = this.$.editor;
			editor.title = `Edit Current Run (#${currentRun.value.order})`;
			editor.loadRun(currentRun.value);
			this.$.editDialog.open();
		}

		editNext() {
			const editor = this.$.editor;
			editor.title = `Edit Next Run (#${nextRun.value.order})`;
			editor.loadRun(nextRun.value);
			this.$.editDialog.open();
		}

		_checkButtons() {
			if (canSeekSchedule.status !== 'declared' ||
				schedule.status !== 'declared' ||
				currentRun.status !== 'declared' ||
				nextRun.status !== 'declared' ||
				!schedule.value) {
				return;
			}

			let shouldDisableNext = false;
			let shouldDisablePrev = false;
			let shouldDisableTake = false;
			if (!canSeekSchedule.value ||
				this._pendingSetCurrentRunByOrderMessageResponse ||
				this._pendingPreviousRunMessageResponse ||
				this._pendingNextRunMessageResponse) {
				shouldDisableNext = true;
				shouldDisablePrev = true;
				shouldDisableTake = true;
			}

			// Disable nextRun button if there is no next run.
			if (!nextRun.value) {
				shouldDisableNext = true;
			}

			// Disable prevRun button if there is no prev run, or if there is no currentRun.
			if (currentRun.value) {
				// If there is any run in the schedule with an earlier order than currentRun,
				// then there must be a prevRun.
				const prevRunExists = schedule.value.find(run => {
					return run.order < currentRun.value.order;
				});
				if (!prevRunExists) {
					shouldDisablePrev = true;
				}
			} else {
				shouldDisablePrev = true;
			}

			// Disable take button if there's no takeTypeahead value.
			if (!this.$.typeahead.value) {
				shouldDisableTake = true;
			}

			if (shouldDisableNext) {
				this.$.next.setAttribute('disabled', 'true');
			} else {
				this.$.next.removeAttribute('disabled');
			}

			if (shouldDisablePrev) {
				this.$.previous.setAttribute('disabled', 'true');
			} else {
				this.$.previous.removeAttribute('disabled');
			}

			if (shouldDisableTake) {
				this.$.take.setAttribute('disabled', 'true');
			} else {
				this.$.take.removeAttribute('disabled');
			}
		}

		_typeaheadKeyup(e) {
			// Enter key
			if (e.which === 13 && this.$.typeahead.inputValue) {
				this.takeTypeahead();
			}
		}
	}

	customElements.define(GdqSchedule.is, GdqSchedule);
})();
