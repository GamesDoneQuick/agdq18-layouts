class DashInterviewTabletLowerthirdRefillOption extends Polymer.Element {
	static get is() {
		return 'dash-interview-tablet-lowerthird-refill-option';
	}

	static get properties() {
		return {
			type: {
				type: String,
				reflectToAttribute: true
			},
			names: Array
		};
	}

	accept() {
		this.dispatchEvent(new CustomEvent('accepted', {
			detail: {
				names: this.names.filter(name => name !== '(none)')
			}
		}));
	}
}

customElements.define(DashInterviewTabletLowerthirdRefillOption.is, DashInterviewTabletLowerthirdRefillOption);
