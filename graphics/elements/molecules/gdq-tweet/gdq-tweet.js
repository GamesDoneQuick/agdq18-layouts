(function () {
	'use strict';

	const TWEET_DISPLAY_DURATION = 9;
	const EMPTY_OBJ = {};

	/**
	 * @customElement
	 * @polymer
	 */
	class GdqTweet extends Polymer.Element {
		static get is() {
			return 'gdq-tweet';
		}

		static get properties() {
			return {
				label: {
					type: String,
					value: ''
				},
				companionElement: {
					type: Object,
					value() {
						return document.querySelector('gdq-sponsors');
					}
				},
				timeline: {
					type: TimelineLite,
					value() {
						return new TimelineLite({autoRemoveChildren: true});
					}
				},
				backgroundOpacity: {
					type: Number,
					value: 0.25
				},

				/**
				 * The message name to bind to.
				 */
				bindToMessage: {
					type: String,
					value: 'showTweet'
				}
			};
		}

		ready() {
			super.ready();
			this._initBackgroundSVG();
			this._addReset();

			if (this.bindToMessage && this.bindToMessage.length > 0) {
				nodecg.listenFor(this.bindToMessage, this.playTweet.bind(this));
			}

			Polymer.RenderStatus.beforeNextRender(this, () => {
				if (!this.companionElement) {
					if (document.querySelector('layout-app')) {
						this.companionElement =
							document.querySelector('layout-app').shadowRoot.querySelector('gdq-sponsors');
					}
				}
			});
		}

		/**
		 * Plays the entrance animation for this element.
		 * Then, holds it for TWEET_DISPLAY_DURATION seconds.
		 * Then, plays the exit animation for this element.
		 *
		 * If this.companionElement is defined, this method will run this.companionElement.hide()
		 * before playing the entrance animation for this element.
		 *
		 * @param {Object} tweet - The tweet to show.
		 * @returns {TimelineLite} - A GSAP TimelineLite instance.
		 */
		playTweet(tweet) {
			const tl = this.timeline;

			this._addReset();

			// Wait for prizes to hide, if applicable.
			tl.call(() => {
				if (this.companionElement && typeof this.companionElement.hide === 'function') {
					tl.pause();

					const hidePrizeTl = this.companionElement.hide();
					hidePrizeTl.call(() => {
						tl.resume();
					});
				}
			}, null, null, '+=0.03');

			this._addEntranceAnim(tweet);
			this._addExitAnim();

			if (this.companionElement && typeof this.companionElement.show === 'function') {
				tl.add(this.companionElement.show());
			}

			// Padding
			tl.to(EMPTY_OBJ, 0.1, EMPTY_OBJ);
		}

		/**
		 * Adds a reset to the master timeline.
		 * @private
		 * @returns {undefined}
		 */
		_addReset() {
			const tl = this.timeline;
			tl.call(() => {
				this.$['body-actual'].innerHTML = '';
				this.$.name.innerHTML = '';
			}, null, null, '+=0.03');
			tl.set(this._bgRect.node, {drawSVG: '0%', 'fill-opacity': 0});
			tl.set([this.$.label, this.$.name], {scaleX: 0, color: 'transparent', clipPath: ''});
			tl.set(this.$['body-actual'], {opacity: 1});
		}

		/**
		 * Adds an entrance animation to the master timeline.
		 * @private
		 * @param {Object} tweet - The tweet to enter.
		 * @returns {undefined}
		 */
		_addEntranceAnim(tweet) {
			const tl = this.timeline;

			tl.addLabel('start', '+=0.03');

			tl.call(() => {
				this.$.name.innerText = `@${tweet.user.screen_name}`;
			}, null, null, 'start');

			tl.to(this._bgRect.node, 0.75, {
				drawSVG: '100%',
				ease: Linear.easeNone
			}, 'start');

			tl.to(this.$.name, 0.334, {
				scaleX: 1,
				ease: Sine.easeInOut,
				callbackScope: this,
				onComplete() {
					this.$.name.style.color = '';
					TypeAnims.type(this.$.name);
				}
			}, 'start+=0.05');

			tl.to(this.$.label, 0.334, {
				scaleX: 1,
				ease: Sine.easeInOut,
				callbackScope: this,
				onComplete() {
					this.$.label.style.color = '';
					TypeAnims.type(this.$.label);
				}
			}, 'start+=0.4');

			tl.to(this._bgRect.node, 0.5, {
				'fill-opacity': this.backgroundOpacity,
				ease: Sine.easeOut
			}, 'start+=1');

			tl.call(() => {
				this.$['body-actual'].innerHTML = tweet.text;
				TypeAnims.type(this.$['body-actual'], {typeInterval: 0.01});
			});
		}

		/**
		 * Adds an exit animation to the master timeline.
		 * @private
		 * @param {Number} delay - How long, in seconds, to delay the start of this animation.
		 * @returns {undefined}
		 */
		_addExitAnim(delay = TWEET_DISPLAY_DURATION) {
			const tl = this.timeline;

			tl.add('exit', `+=${delay}`);

			tl.add(MaybeRandom.createTween({
				target: this.$['body-actual'].style,
				propName: 'opacity',
				duration: 0.465,
				start: {probability: 1, normalValue: 1},
				end: {probability: 0, normalValue: 0}
			}), 'exit');

			tl.to(this._bgRect.node, 0.5, {
				'fill-opacity': 0,
				ease: Sine.easeOut
			}, 'exit');

			tl.to(this._bgRect.node, 1.5, {
				drawSVG: '0%',
				ease: Power2.easeIn
			}, 'exit');

			tl.fromTo(this.$.label, 0.334, {
				clipPath: 'inset(0 0% 0 0)'
			}, {
				clipPath: 'inset(0 100% 0 0)',
				ease: Sine.easeInOut
			}, 'exit+=0.9');

			tl.fromTo(this.$.name, 0.334, {
				clipPath: 'inset(0 0 0 0%)'
			}, {
				clipPath: 'inset(0 0 0 100%)',
				ease: Sine.easeInOut
			}, 'exit+=1.3');
		}

		_initBackgroundSVG() {
			const STROKE_SIZE = 1;
			const ELEMENT_WIDTH = this.$.background.clientWidth;
			const ELEMENT_HEIGHT = this.$.background.clientHeight;

			const svgDoc = SVG(this.$.background);
			const bgRect = svgDoc.rect();
			this._bgRect = bgRect;

			svgDoc.size(ELEMENT_WIDTH, ELEMENT_HEIGHT);

			// Intentionally flip the width and height.
			// This is part of how we get the drawSVG anim to go in the direction we want.
			bgRect.size(ELEMENT_HEIGHT, ELEMENT_WIDTH);
			bgRect.stroke({
				color: 'white',

				// Makes it effectively STROKE_SIZE, because all SVG strokes
				// are center strokes, and the outer half is cut off.
				width: STROKE_SIZE * 2
			});
			bgRect.fill({color: 'black', opacity: this.backgroundOpacity});

			// Rotate and translate such that drawSVG anims start from the top right
			// and move clockwise to un-draw, counter-clockwise to un-draw.
			bgRect.style({transform: `rotate(90deg) translateY(${-ELEMENT_WIDTH}px)`});
		}

		_falsey(value) {
			return !value;
		}
	}

	customElements.define(GdqTweet.is, GdqTweet);
})();
