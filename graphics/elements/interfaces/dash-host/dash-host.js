(function () {
	'use strict';

	class DashHost extends Polymer.MutableData(Polymer.Element) {
		static get is() {
			return 'dash-host';
		}

		static get properties() {
			return {
				currentTime: {
					type: String
				},
				selectedBidsAndPrizesTab: {
					type: Number,
					value: 0
				}
			};
		}

		connectedCallback() {
			super.connectedCallback();
			this.updateCurrentTime = this.updateCurrentTime.bind(this);
			this.updateCurrentTime();
			setInterval(this.updateCurrentTime, 1000);
		}

		updateCurrentTime() {
			const date = new Date();
			this.currentTime = date.toLocaleTimeString('en-US', {hour12: true});
		}
	}

	customElements.define(DashHost.is, DashHost);
})();
