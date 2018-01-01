(function () {
	'use strict';

	const NAME_FADE_IN_EASE = Power1.easeOut;
	const NAME_FADE_OUT_EASE = Power1.easeIn;

	class GdqNameplate extends Polymer.Element {
		static get is() {
			return 'gdq-nameplate';
		}

		static get properties() {
			return {
				noLeftCap: {
					type: Boolean,
					reflectToAttribute: true,
					value: false
				},
				noRightCap: {
					type: Boolean,
					reflectToAttribute: true,
					value: false
				},
				name: {
					type: String,
					value: ''
				},
				twitch: {
					type: String,
					value: ''
				},

				/**
				 * How long, in seconds, to fade names in/out.
				 *
				 * For example, a value of 0.33 means that the fade out will take 0.33
				 * seconds, and then the subsequent fade in will take another 0.33 seconds.
				 */
				nameFadeDuration: {
					type: Number,
					value: 0.33
				},
				_nameTL: {
					type: TimelineMax,
					readOnly: true,
					value() {
						return new TimelineMax({repeat: -1, paused: true});
					}
				}
			};
		}

		ready() {
			super.ready();

			// Create looping anim for main nameplate.
			this._nameTL.to(this.$.names, this.nameFadeDuration, {
				onStart: function () {
					this.$.namesTwitch.classList.remove('hidden');
					this.$.namesName.classList.add('hidden');
				}.bind(this),
				opacity: 1,
				ease: NAME_FADE_IN_EASE
			});
			this._nameTL.to(this.$.names, this.nameFadeDuration, {
				opacity: 0,
				ease: NAME_FADE_OUT_EASE
			}, '+=10');
			this._nameTL.to(this.$.names, this.nameFadeDuration, {
				onStart: function () {
					this.$.namesTwitch.classList.add('hidden');
					this.$.namesName.classList.remove('hidden');
				}.bind(this),
				opacity: 1,
				ease: NAME_FADE_IN_EASE
			});
			this._nameTL.to(this.$.names, this.nameFadeDuration, {
				opacity: 0,
				ease: NAME_FADE_OUT_EASE
			}, '+=80');
		}

		updateName({alias = '?', twitchAlias = '?', rotate = true} = {}) {
			TweenLite.to(this.$.names, this.nameFadeDuration, {
				opacity: 0,
				ease: NAME_FADE_OUT_EASE,
				callbackScope: this,
				onComplete() {
					this.name = alias;
					this.twitch = twitchAlias;

					this.$.namesName.classList.add('hidden');
					this.$.namesTwitch.classList.remove('hidden');

					if (!this.twitch) {
						this._nameTL.pause();
						this.$.namesName.classList.remove('hidden');
						this.$.namesTwitch.classList.add('hidden');
						TweenLite.to(this.$.names, this.nameFadeDuration, {opacity: 1, ease: NAME_FADE_IN_EASE});
					} else if (rotate) {
						this._nameTL.restart();
					} else {
						this._nameTL.pause();
						TweenLite.to(this.$.names, this.nameFadeDuration, {opacity: 1, ease: NAME_FADE_IN_EASE});
					}

					Polymer.RenderStatus.afterNextRender(this, this.fitName);
				}
			});
		}

		fitName() {
			Polymer.flush();
			const MAX_NAME_WIDTH = this.$.names.clientWidth - 32;
			const MAX_TWITCH_WIDTH = MAX_NAME_WIDTH - 20;
			const twitchText = this.$.namesTwitch.querySelector('sc-fitted-text');
			this.$.namesName.maxWidth = MAX_NAME_WIDTH;
			twitchText.maxWidth = MAX_TWITCH_WIDTH;
		}
	}

	customElements.define(GdqNameplate.is, GdqNameplate);
})();
