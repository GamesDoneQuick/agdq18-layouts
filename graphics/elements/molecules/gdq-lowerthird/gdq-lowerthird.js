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
				names: Array,
				numNames: {
					type: Number,
					reflectToAttribute: true
				},
				greebles: Array
			};
		}

		ready() {
			super.ready();
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
				let intervieweeNames = interviewNames.value.slice(0);
				intervieweeNames = intervieweeNames.filter(name => Boolean(name));

				this.names = intervieweeNames;
				this.numNames = this.names.length;
				// this.$.header.updateName({alias: '#AGDQ2018', twitchAlias: null, rotate: false});

				this.listingElements = this.names;
				console.log(this.listingElements);

				this.listingElements.forEach((listingElement, index) => {
					listingElement.updateName({alias: '#AGDQ2018', twitchAlias: null, rotate: false});
				});

				Polymer.flush();
			}, null, this, '+=0.3'); // Give time for interviewNames replicant to update.

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

			tl.set([this, this.$.names], {clearProps: 'all'});
		}
	}

	customElements.define(GdqLowerthird.is, GdqLowerthird);
})();
