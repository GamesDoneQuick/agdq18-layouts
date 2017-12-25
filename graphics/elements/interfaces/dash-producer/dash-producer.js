(function () {
	'use strict';

	class DashProducer extends Polymer.MutableData(Polymer.Element) {
		static get is() {
			return 'dash-producer';
		}

		static get properties() {
			return {
				currentTime: {
					type: String
				},
				selectedContentTab: {
					type: Number,
					value: 0
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

	customElements.define(DashProducer.is, DashProducer);
})();
