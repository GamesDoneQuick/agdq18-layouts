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
				}
			};
		}

		ready() {
			super.ready();

			this.$.header.updateName({alias: '#AGDQ2018', twitchAlias: null, rotate: false});
			this._$nameElements = Array.from(this.$.names.querySelectorAll('gdq-nameplate'));

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
				const names = interviewNames.value.filter(name => Boolean(name));
				this._$nameElements.forEach((nameElement, index) => {
					nameElement.updateName({alias: names[index], twitchAlias: null, rotate: false});
					nameElement.hidden = !names[index];
				});
			}, null, null, '+=0.3'); // Give time for interviewNames replicant to update.

			tl.to(this, 0.2, {
				opacity: 1,
				ease: Power3.easeInOut
			});

			tl.staggerFrom(this._$nameElements, 0.2, {
				x: -30,
				opacity: 0,
				ease: Power4.easeOut
			}, 0.15);
		}

		hide() {
			const tl = this.tl;
			tl.to(this, 0.4, {
				opacity: 0,
				ease: Power3.easeIn
			});
		}
	}

	customElements.define(GdqLowerthird.is, GdqLowerthird);
})();
