(function () {
	'use strict';

	const interviewNames = nodecg.Replicant('interview:names');
	const lowerthirdShowing = nodecg.Replicant('interview:lowerthirdShowing');

	class GdqLowerthird extends Polymer.Element {
		static get is() {
			return 'gdq-lowerthird';
		}

		static get properties() {
			return {
				tl: {
					type: TimelineLite,
					value() {
						return new TimelineLite({autoRemoveChildren: true});
					},
					readOnly: true
				},
				names: Array
			};
		}

		ready() {
			super.ready();

			this.$.header.updateName({alias: '#AGDQ2018', twitchAlias: null, rotate: false});

			lowerthirdShowing.on('change', newVal => {
				if (newVal) {
					this.show();
				} else {
					this.hide();
				}
			});
		}

		show() {
			const tl = this.tl;

			// Set names
			tl.call(() => {
				this.names = interviewNames.value.filter(name => Boolean(name));
				this.$.repeat.render();
				this.listingElements = Array.from(this.$.names.querySelectorAll('gdq-nameplate'));
				this.listingElements.forEach((listingElement, index) => {
					listingElement.updateName({alias: this.names[index], twitchAlias: null, rotate: false});
				});
			}, null, null, '+=0.3'); // Give time for interviewNames replicant to update.

			tl.to(this, 1, {
				opacity: 1,
				ease: Power3.easeInOut
			});
		}

		hide() {
			const tl = this.tl;
			tl.to(this, 0.9, {
				opacity: 0,
				ease: Power3.easeIn
			});
		}
	}

	customElements.define(GdqLowerthird.is, GdqLowerthird);
})();
