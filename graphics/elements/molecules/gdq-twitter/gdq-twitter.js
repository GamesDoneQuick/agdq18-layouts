(function () {
	'use strict';

	const BODY_DISPLAY_DURATION = 9;

	class GdqTwitter extends Polymer.Element {
		static get is() {
			return 'gdq-twitter';
		}

		static get properties() {
			return {
				tl: {
					type: TimelineLite,
					value() {
						return new TimelineLite({
							autoRemoveChilren: true,
							onComplete() {
								// Remove will-change every time the timeline is emptied
								this.$.namebar.style.willChange = '';
								this.$.body.style.willChange = '';
								this.style.willChange = '';
							},
							onCompleteScope: this
						});
					},
					readOnly: true
				}
			};
		}

		connectedCallback() {
			super.connectedCallback();
			nodecg.listenFor('showTweet', this.showTweet.bind(this));
			Polymer.RenderStatus.afterNextRender(this, () => {
				this._sponsors = document.querySelector('gdq-sponsors') ||
					document.querySelector('layout-app').shadowRoot.querySelector('gdq-sponsors');
			});
		}

		showTweet(tweet) {
			const tl = this.tl;

			// Set will-change on all the elements we're about to animate.
			this.$.namebar.style.willChange = 'transform';
			this.$.body.style.willChange = 'opacity, transform';
			this.style.willChange = 'transform, opacity';

			// Reset
			tl.set(this, {opacity: 0, y: '0%'});
			tl.set(this.$.namebar, {opacity: 0, y: '100%'});
			tl.set(this.$.body, {opacity: 0, y: '-5%'});

			tl.to({}, 0.2, {
				onStart: function () {
					if (this._sponsors) {
						TweenLite.to(this._sponsors, 0.33, {
							opacity: 0,
							ease: Power1.easeIn
						});
					}

					this.$.body.innerHTML = tweet.text;
					this.$.username.innerText = `@${tweet.user.screen_name}`;
				}.bind(this),
				onComplete: function () {
					textFit(this.$.body);

					const maxNameWidth = this.$.username.clientWidth;
					const nameWidth = this.$.username.scrollWidth;
					if (nameWidth > maxNameWidth) {
						TweenLite.set(this.$.username, {scaleX: maxNameWidth / nameWidth});
					} else {
						TweenLite.set(this.$.username, {scaleX: 1});
					}
				}.bind(this)
			});

			tl.to(this, 0.33, {
				opacity: 1,
				ease: Power1.easeOut
			});

			tl.add('namebarIn', '-=0.09');
			tl.to(this.$.namebar, 0.33, {
				opacity: 1,
				ease: Power1.easeOut
			}, 'namebarIn');
			tl.to(this.$.namebar, 0.7, {
				y: '0%',
				ease: Back.easeOut
			}, 'namebarIn');

			tl.to(this.$.body, 0.6, {
				y: '0%',
				opacity: 1,
				ease: Power1.easeOut
			}, '-=0.25');

			tl.add('exit', `+=${BODY_DISPLAY_DURATION}`);
			tl.to(this, 0.4, {
				opacity: 0,
				ease: Power1.easeIn
			}, 'exit');
			tl.to([this.$.namebar, this.$.body], 0.4, {
				y: '25%',
				ease: Power2.easeIn
			}, 'exit');

			if (this._sponsors) {
				tl.to(this._sponsors, 0.33, {
					opacity: 1,
					ease: Power1.easeOut
				});
			}

			// Padding
			tl.to({}, 0.1, {});
		}
	}

	customElements.define(GdqTwitter.is, GdqTwitter);
})();
