(function () {
	'use strict';

	const autoCycleRecordings = nodecg.Replicant('autoCycleRecordings');
	const autoUploadRecordings = nodecg.Replicant('autoUploadRecordings');

	class GdqRecordings extends Polymer.Element {
		static get is() {
			return 'gdq-recordings';
		}

		static get properties() {
			return {};
		}

		ready() {
			super.ready();
			Polymer.RenderStatus.beforeNextRender(this, () => {
				autoCycleRecordings.on('change', newVal => {
					this.$.cycleToggle.checked = newVal;
					this._checkUploadToggleDisable();
				});

				autoUploadRecordings.on('change', newVal => {
					this.$.uploadToggle.checked = newVal;
				});

				this._checkUploadToggleDisable();
			});
		}

		_checkUploadToggleDisable() {
			if (!autoCycleRecordings.value || !nodecg.bundleConfig.youtubeUploadScriptPath) {
				this.$.uploadToggle.setAttribute('disabled', 'true');
			} else {
				this.$.uploadToggle.removeAttribute('disabled');
			}
		}

		_handleCycleToggleChange(e) {
			autoCycleRecordings.value = e.target.checked;
		}

		_handleUploadToggleChange(e) {
			autoUploadRecordings.value = e.target.checked;
		}
	}

	customElements.define(GdqRecordings.is, GdqRecordings);
})();
