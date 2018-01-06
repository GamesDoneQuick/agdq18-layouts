(function () {
	'use strict';

	class DashInterviewTablet extends Polymer.MutableData(Polymer.GestureEventListeners(Polymer.Element)) {
		static get is() {
			return 'dash-interview-tablet';
		}

		static get properties() {
			return {
				lowerthirdShowing: {
					type: Boolean,
					reflectToAttribute: true
				},
				questionShowing: {
					type: Boolean,
					reflectToAttribute: true
				},
				selectedContentTab: {
					type: Number,
					value: 2
				}
			};
		}

		ready() {
			super.ready();

			this.$.hotbar.addEventListener('auto-fill-names-clicked', () => {
				this.$.lowerthird.autoFillNames();
			});

			this.$.hotbar.addEventListener('show-lowerthird-clicked', () => {
				this.$.lowerthird.autoLowerthird();
			});

			this.$.hotbar.addEventListener('hide-lowerthird-clicked', () => {
				this.$.lowerthird.hideLowerthird();
			});
		}
	}

	customElements.define(DashInterviewTablet.is, DashInterviewTablet);
})();
