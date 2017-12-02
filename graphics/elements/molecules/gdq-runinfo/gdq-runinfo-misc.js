/**
 * @customElement
 * @polymer
 */
class GdqRuninfoMisc extends Polymer.Element {
	static get is() {
		return 'gdq-runinfo-misc';
	}

	static get properties() {
		return {
			maxTextWidth: Number,
			console: String,
			releaseYear: String,
			estimate: String
		};
	}
}

customElements.define(GdqRuninfoMisc.is, GdqRuninfoMisc);
