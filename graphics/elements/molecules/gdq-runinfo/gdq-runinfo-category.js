/**
 * @customElement
 * @polymer
 */
class GdqRuninfoCategory extends Polymer.Element {
	static get is() {
		return 'gdq-runinfo-category';
	}

	static get properties() {
		return {
			maxTextWidth: Number,
			category: String
		};
	}
}

customElements.define(GdqRuninfoCategory.is, GdqRuninfoCategory);
