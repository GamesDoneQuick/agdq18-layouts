/**
 * @customElement
 * @polymer
 */
class AtomInnerGlowText extends Polymer.Element {
	static get is() {
		return 'atom-inner-glow-text';
	}

	static get properties() {
		return {
			text: String
		};
	}
}

customElements.define(AtomInnerGlowText.is, AtomInnerGlowText);
