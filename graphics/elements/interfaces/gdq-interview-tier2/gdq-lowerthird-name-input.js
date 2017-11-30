class GdqLowerthirdNameInput extends Polymer.Element {
	static get is() {
		return 'gdq-lowerthird-name-input';
	}

	static get properties() {
		return {
			selectedItem: {
				type: String,
				notify: true
			},
			value: {
				type: String,
				notify: true
			},
			disabled: Boolean,
			items: Array
		};
	}

	clear() {
		this.$.input.value = '';
	}
}

customElements.define(GdqLowerthirdNameInput.is, GdqLowerthirdNameInput);
