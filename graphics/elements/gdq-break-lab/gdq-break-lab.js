/* global SplitText */
(function () {
	'use strict';

	const TYPE_INTERVAL = 0.03;
	const NP_FADE_DURATION = 0.334;
	const TWEET_DISPLAY_DURATION = 9;
	const EMPTY_OBJ = {};
	const bits = nodecg.Replicant('bits:total');

	class GdqBreakLab extends Polymer.Element {
		static get is() {
			return 'gdq-break-lab';
		}

		static get properties() {
			return {
				tweetTL: {
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
			nodecg.listenFor('showTweet', this.showTweet.bind(this));
			nodecg.listenFor('cheer', this.newCheer.bind(this));
			bits.on('change', this.bitsChanged.bind(this));

			Polymer.RenderStatus.beforeNextRender(this, () => {
				TweenLite.set(this.$['tweet-bg'], {scaleY: 0});
			});
		}

		bitsChanged(newVal) {
			this.bits = newVal.toLocaleString('en-US');
		}

		testCheer(min, max) {
			const test = this.randomIntFromInterval(min, max);
			this.newCheer({bits_used: test}); // eslint-disable-line camelcase
		}

		newCheer(cheer) {
			const tl = new TimelineLite({autoRemoveChildren: true});
			const cheerDiv = document.createElement('div');
			cheerDiv.classList.add('cheer');
			switch (true) {
				case (cheer.bits_used < 100):
					cheerDiv.innerHTML = '<video src="vid/chGrey.webm" autoplay>';
					break;
				case (cheer.bits_used < 1000):
					cheerDiv.innerHTML = '<video src="vid/chPurple.webm" autoplay>';
					break;
				case (cheer.bits_used < 5000):
					cheerDiv.innerHTML = '<video src="vid/chGreen.webm" autoplay>';
					break;
				case (cheer.bits_used < 10000):
					cheerDiv.innerHTML = '<video src="vid/chBlue.webm" autoplay>';
					break;
				case (cheer.bits_used < 100000):
					cheerDiv.innerHTML = '<video src="vid/chRed.webm" autoplay>';
					break;
				default:
					nodecg.log.error('Unexpected value for bits_used:', JSON.stringify(cheer, null, 2));
			}

			cheerDiv.style.left = this.randomIntFromInterval(0, 450) + 'px';
			cheerDiv.style.top = this.randomIntFromInterval(15, 35) + 'px';

			tl.add('enter');

			tl.call(() => {
				this.$.fireworks.appendChild(cheerDiv);
			}, null, null, 'enter');

			tl.call(() => {
				this.$.fireworks.removeChild(cheerDiv);
			}, null, null, 'enter+=2');
		}

		randomIntFromInterval(min, max) {
			return Math.floor((Math.random() * (max - min + 1)) + min);
		}

		showTweet(tweet) {
			const tl = this.tweetTL;

			// Reset
			tl.call(() => {
				this.$['tweet-body-text'].innerText = '';
			});
			tl.set(this.$['tweet-body-text'], {opacity: 1});

			tl.add('transition');

			tl.to(this.$['tweet-bg'], NP_FADE_DURATION * 1.5, {
				scaleY: 1,
				ease: Power2.easeInOut
			}, 'transition');

			tl.add('enter');

			tl.call(() => {
				this.$['tweet-body-text'].innerHTML = tweet.text;
				const splitTL = new TimelineLite();

				// eslint-disable-next-line no-new
				new SplitText(this.$['tweet-body-text'], {
					type: 'words,chars',
					charsClass: 'character style-scope gdq-break-lab'
				});

				const charsAndEmoji = this.$['tweet-body-text'].querySelectorAll('.character, .emoji');
				splitTL.staggerFrom(charsAndEmoji, 0.001, {
					visibility: 'hidden'
				}, TYPE_INTERVAL);
			}, null, null, 'enter');

			tl.to(this.$['tweet-name'], 0.446, {
				onStart() {
					this.$['tweet-name-text'].innerText = `@${tweet.user.screen_name}`;
				},
				callbackScope: this,
				y: '0%',
				ease: Power2.easeOut
			}, 'enter');

			tl.add('exit', `+=${TWEET_DISPLAY_DURATION}`);

			tl.to(this.$['tweet-body-text'], NP_FADE_DURATION, {
				opacity: 0,
				ease: Power1.easeIn
			}, 'exit');

			tl.to(this.$['tweet-name'], 0.446, {
				y: '100%',
				ease: Power2.easeIn
			}, 'exit');

			tl.add('transition-out');

			tl.to(this.$['tweet-bg'], NP_FADE_DURATION * 1.5, {
				scaleY: 0,
				ease: Power2.easeInOut
			}, 'transition-out');

			// Padding
			tl.to(EMPTY_OBJ, 0.1, EMPTY_OBJ);
		}
	}

	customElements.define(GdqBreakLab.is, GdqBreakLab);
})();
