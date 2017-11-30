(function () {
	const currentPrizes = nodecg.Replicant('currentPrizes');

	class GdqHostDashboardPrizes extends Polymer.MutableData(Polymer.Element) {
		static get is() {
			return 'gdq-hostdash-prizes';
		}

		static get properties() {
			return {
				prizes: {
					type: Array
				}
			};
		}

		ready() {
			super.ready();
			currentPrizes.on('change', newVal => {
				this.prizes = newVal;
			});
		}
	}

	customElements.define(GdqHostDashboardPrizes.is, GdqHostDashboardPrizes);
})();
