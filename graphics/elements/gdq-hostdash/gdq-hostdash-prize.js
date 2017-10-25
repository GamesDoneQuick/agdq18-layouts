class GdqHostDashboardPrize extends Polymer.MutableData(Polymer.Element) {
	static get is() {
		return 'gdq-hostdash-prize';
	}

	static get properties() {
		return {
			prize: {
				type: Object
			}
		};
	}
}

customElements.define(GdqHostDashboardPrize.is, GdqHostDashboardPrize);
