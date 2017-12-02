/**
 * @customElement
 * @polymer
 */
class AtomGreeble extends Polymer.Element {
	static get is() {
		return 'atom-greeble';
	}

	static get properties() {
		return {
			align: {
				type: String,
				value: 'left',
				reflectToAttribute: true
			}
		};
	}
}

customElements.define(AtomGreeble.is, AtomGreeble);
