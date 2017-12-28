/**
 * @customElement
 * @polymer
 */
class DashInterviewTabletModeToggle extends Polymer.Element {
	static get is() {
		return 'dash-interview-tablet-mode-toggle';
	}

	static get properties() {
		return {
			checked: {
				type: Boolean,
				reflectToAttribute: true,
				notify: true,
				value: false
			}
		};
	}
}

customElements.define(DashInterviewTabletModeToggle.is, DashInterviewTabletModeToggle);
