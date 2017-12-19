/**
 * @customElement
 * @polymer
 */
class GdqBreakScheduleHeader extends Polymer.Element {
	static get is() {
		return 'gdq-break-schedule-header';
	}

	static get properties() {
		return {
			text: String
		};
	}
}

customElements.define(GdqBreakScheduleHeader.is, GdqBreakScheduleHeader);
