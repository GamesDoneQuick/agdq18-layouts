/**
 * @customElement
 * @polymer
 */
class DashInterviewMonitorPrize extends Polymer.Element {
	static get is() {
		return 'dash-interview-monitor-prize';
	}

	static get properties() {
		return {
			prize: Object,
			bidType: {
				type: String,
				reflectToAttribute: true,
				computed: '_computeBidType(prize)'
			}
		};
	}

	_computeBidType(prize) {
		return prize.sumdonations ? 'total' : 'single';
	}
}

customElements.define(DashInterviewMonitorPrize.is, DashInterviewMonitorPrize);
