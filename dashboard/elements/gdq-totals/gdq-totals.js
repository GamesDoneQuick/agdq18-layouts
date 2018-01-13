(function () {
	'use strict';

	const cashTotal = nodecg.Replicant('total');
	const autoUpdateTotal = nodecg.Replicant('autoUpdateTotal');
	const recordTrackerEnabled = nodecg.Replicant('recordTrackerEnabled');

	class GdqTotals extends Polymer.Element {
		static get is() {
			return 'gdq-totals';
		}

		static get properties() {
			return {
				cashTotal: {
					type: String,
					value: '?'
				},
				bitsTotal: {
					type: String,
					value: '?'
				},
				autoUpdateTotal: Boolean,
				recordTrackerEnabled: Boolean
			};
		}

		ready() {
			super.ready();
			cashTotal.on('change', newVal => {
				this.cashTotal = newVal.formatted;
			});
			autoUpdateTotal.on('change', newVal => {
				this.autoUpdateTotal = newVal;
			});
			recordTrackerEnabled.on('change', newVal => {
				this.recordTrackerEnabled = newVal;
			});
		}

		editCashTotal() {
			this.$.editTotalInput.value = cashTotal.value.raw;
			this._editTarget = 'cash';
			this.$.editDialog.open();
		}

		_handleAutoUpdateToggleChange(e) {
			autoUpdateTotal.value = e.target.checked;
		}

		_handleMiletoneTrackerToggleChange(e) {
			recordTrackerEnabled.value = e.target.checked;
		}

		_handleEditDialogConfirmed() {
			nodecg.sendMessage('setTotal', {
				type: this._editTarget,
				newValue: parseFloat(this.$.editTotalInput.value)
			});
		}
	}

	customElements.define(GdqTotals.is, GdqTotals);
})();
