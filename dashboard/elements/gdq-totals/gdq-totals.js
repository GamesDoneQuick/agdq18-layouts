(function () {
	'use strict';

	const cashTotal = nodecg.Replicant('total');
	const bitsTotal = nodecg.Replicant('bits:total');
	const autoUpdateTotal = nodecg.Replicant('autoUpdateTotal');

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
				}
			};
		}

		ready() {
			super.ready();
			cashTotal.on('change', newVal => {
				this.cashTotal = newVal.formatted;
			});
			bitsTotal.on('change', newVal => {
				this.bitsTotal = newVal.toLocaleString('en-US');
			});
			autoUpdateTotal.on('change', newVal => {
				this.autoUpdateTotal = newVal;
			});
		}

		editCashTotal() {
			this.$.editTotalInput.value = cashTotal.value.raw;
			this._editTarget = 'cash';
			this.$.editDialog.open();
		}

		editBitsTotal() {
			this.$.editTotalInput.value = bitsTotal.value;
			this._editTarget = 'bits';
			this.$.editDialog.open();
		}

		_handleAutoUpdateToggleChange(e) {
			autoUpdateTotal.value = e.target.checked;
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
