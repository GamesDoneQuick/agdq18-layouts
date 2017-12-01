/**
 * @customElement
 * @polymer
 */
class AtromGradientText extends Polymer.Element {
	static get is() {
		return 'atom-gradient-text';
	}

	static get properties() {
		return {
			text: String,
			align: {
				type: String,
				reflectToAttribute: true
			},
			maxWidth: Number
		};
	}
}

customElements.define(AtromGradientText.is, AtromGradientText);
