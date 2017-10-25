(function () {
	'use strict';

	const checklist = nodecg.Replicant('checklist');

	class GdqChecklist extends Polymer.MutableData(Polymer.Element) {
		static get is() {
			return 'gdq-checklist';
		}

		ready() {
			super.ready();
			checklist.on('change', newVal => {
				this.extraContent = newVal.extraContent;
				this.techStationDuties = newVal.techStationDuties;
				this.stageTechDuties = newVal.stageTechDuties;
				this.audioReady = newVal.audioEngineerDuties.every(task => task.complete);
			});

			this._checkboxChanged = this._checkboxChanged.bind(this);
			this.addEventListener('change', this._checkboxChanged);
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

	customElements.define(GdqChecklist.is, GdqChecklist);
})();
