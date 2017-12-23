/**
 * @customElement
 * @polymer
 */
class GdqBreak extends Polymer.Element {
	static get is() {
		return 'gdq-break';
	}

	static get properties() {
		return {};
	}

	ready() {
		super.ready();
		this.$.tweet.companionElement = this.$.prizes;
	}
}

customElements.define(GdqBreak.is, GdqBreak);
