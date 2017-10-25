(function () {
	'use strict';

	const FADE_DURATION = 0.66;
	const FADE_OUT_EASE = Power1.easeIn;
	const FADE_IN_EASE = Power1.easeOut;
	const HOLD_DURATION = 45;

	class GdqSponsors extends Polymer.Element {
		static get is() {
			return 'gdq-sponsors';
		}

		static get properties() {
			return {

			};
		}

		ready() {
			super.ready();

			let sponsors;
			const layoutName = window.location.pathname.split('/').pop();
			switch (layoutName) {
				case ('standard_1.html'):
				case ('standard_1_ff6.html'):
					sponsors = nodecg.Replicant('assets:sponsors-standard_1');
					break;
				case ('standard_2.html'):
				case ('gameboy_2.html'):
					sponsors = nodecg.Replicant('assets:sponsors-standard_2');
					break;
				case ('standard_3.html'):
				case ('gameboy_3.html'):
					sponsors = nodecg.Replicant('assets:sponsors-standard_3');
					break;
				case ('widescreen_1.html'):
					sponsors = nodecg.Replicant('assets:sponsors-widescreen_1');
					break;
				case ('widescreen_2.html'):
					sponsors = nodecg.Replicant('assets:sponsors-widescreen_2');
					break;
				case ('gba_1.html'):
					sponsors = nodecg.Replicant('assets:sponsors-gba_1');
					break;
				case ('gba_2.html'):
					sponsors = nodecg.Replicant('assets:sponsors-gba_2');
					break;
				case ('gameboy_1.html'):
				case ('ds_vertical.html'):
					sponsors = nodecg.Replicant('assets:sponsors-gameboy_1');
					break;
				case ('3ds.html'):
					sponsors = nodecg.Replicant('assets:sponsors-3ds');
					break;
				default:
					throw new Error(`Unexpected pathname! ${window.location.pathname}`);
			}

			sponsors.on('change', newVal => {
				this.sponsors = newVal;

				// If no sponsor is showing yet, show the first sponsor immediately
				if (!this.currentSponsor && newVal.length > 0) {
					this.currentSponsor = newVal[0];
					this.$.image.src = newVal[0].url;

					TweenLite.to(this.$.image, FADE_DURATION, {
						opacity: 1,
						ease: FADE_IN_EASE
					});
				}
			});

			// Cycle through sponsor logos every this.duration seconds
			setInterval(this.nextSponsor.bind(this), HOLD_DURATION * 1000);
		}

		nextSponsor() {
			// If there's no images, do nothing
			if (!this.sponsors || this.sponsors.length <= 0) {
				return;
			}

			// Figure out the array index of the current sponsor
			let currentIdx = -1;
			this.sponsors.some((sponsor, index) => {
				if (sponsor.name === this.currentSponsor.name) {
					currentIdx = index;
					return true;
				}

				return false;
			});

			let nextIdx = currentIdx + 1;

			// If this index is greater than the max, loop back to the start
			if (nextIdx >= this.sponsors.length) {
				nextIdx = 0;
			}

			// Set the new image
			const nextSponsor = this.sponsors[nextIdx];

			// Create one-time animation to fade from current to next.
			const tl = new TimelineLite();

			tl.to(this.$.image, FADE_DURATION, {
				opacity: 0,
				ease: FADE_OUT_EASE,
				onComplete: function () {
					this.currentSponsor = nextSponsor;
					this.$.image.src = nextSponsor.url;
				}.bind(this)
			});

			tl.to(this.$.image, FADE_DURATION, {
				opacity: 1,
				ease: FADE_IN_EASE
			}, 'start');
		}
	}

	customElements.define(GdqSponsors.is, GdqSponsors);
})();
