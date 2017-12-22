/**
 * @customElement
 * @polymer
 */
class GdqBreakHeader extends Polymer.Element {
	static get is() {
		return 'gdq-break-header';
	}

	static get properties() {
		return {
			text: String
		};
	}
}

customElements.define(GdqBreakHeader.is, GdqBreakHeader);
