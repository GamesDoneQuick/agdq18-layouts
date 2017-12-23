(function () {
	const currentHost = nodecg.Replicant('currentHost');

	/**
	 * @customElement
	 * @polymer
	 */
	class DashHostName extends Polymer.Element {
		static get is() {
			return 'dash-host-name';
		}

		static get properties() {
			return {
				currentHost: String,
				_enteredName: {
					type: String,
					value: ''
				}
			};
		}

		ready() {
			super.ready();
			currentHost.on('change', newVal => {
				this.currentHost = newVal;
			});
		}

		take() {
			currentHost.value = this._enteredName;
			this._enteredName = '';
		}

		_falsey(value) {
			return !value;
		}
	}

	customElements.define(DashHostName.is, DashHostName);
})();
