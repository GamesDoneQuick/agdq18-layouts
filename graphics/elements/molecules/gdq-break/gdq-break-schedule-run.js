/**
 * @customElement
 * @polymer
 */
class GdqBreakScheduleRun extends Polymer.MutableData(Polymer.Element) {
	static get is() {
		return 'gdq-break-schedule-run';
	}

	static get properties() {
		return {
			importPath: String, // https://github.com/Polymer/polymer-linter/issues/71
			run: {
				type: Object,
				observer: '_runChanged'
			},
			upNext: {
				type: Boolean,
				reflectToAttribute: true,
				value: false
			}
		};
	}

	_runChanged(newVal) {
		Polymer.RenderStatus.afterNextRender(this, () => {
			const WIDTH_ADDED_BY_BORDERS = 2;
			const PADDING_OF_INFO_RUNNER = 48;
			this.$['info-runner'].text = newVal.runners[0].name;
			this.$['info-runner'].maxWidth =
				this.$.info.clientWidth -
				WIDTH_ADDED_BY_BORDERS -
				PADDING_OF_INFO_RUNNER -
				this.$['info-category'].clientWidth;
		});
	}

	_formatRunName(runName) {
		if (!runName || typeof runName !== 'string') {
			return '?';
		}

		return runName.replace('/\\n/g', '<br/>');
	}
}

customElements.define(GdqBreakScheduleRun.is, GdqBreakScheduleRun);
