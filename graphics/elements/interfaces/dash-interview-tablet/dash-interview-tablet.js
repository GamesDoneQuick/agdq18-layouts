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
				prizeEditingMode: {
					type: Boolean,
					value: false,
					reflectToAttribute: true
				}
			};
		}

		_calcSelectedPage(prizeEditingMode) {
			return prizeEditingMode ? 1 : 0;
		}
	}

	customElements.define(DashInterviewTablet.is, DashInterviewTablet);
})();
