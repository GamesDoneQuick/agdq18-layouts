/* global MaybeRandom */
(function () {
	'use strict';

	/**
	 * The options argument for the `show` and `change` methods in gdq-omnibar-label.
	 * @typedef {Object} LabelShowAndChangeOptions
	 * @property {String} avatarIconName - The name of the icon to use for the avatar. Must be present in gdq-omnibar-icons.
	 * @property {Number} flagHoldDuration - How long, in seconds, to display the flag before hiding it.
	 * @property {String} ringColor - The color to apply to the ring around the label icon.
	 * @property {String} flagColor - The color to apply to the expanded rect that sometimes shows around the label.
	 */

	const FLAG_ENTRANCE_DURATION = 0.334;

	class GdqOmnibarLabel extends Polymer.Element {
		static get is() {
			return 'gdq-omnibar-label';
		}

		ready() {
			super.ready();
			this.show = this.show.bind(this);
			this.change = this.change.bind(this);
			this.playFlag = this.playFlag.bind(this);
			this.hide = this.hide.bind(this);
		}

		/**
		 * Creates an animation timeline for showing the label.
		 * @param {String} text - The text to show.
		 * @param {LabelShowAndChangeOptions} options - Options for this animation.
		 * @returns {TimelineLite} - An animation timeline.
		 */
		show(text, {avatarIconName, flagHoldDuration, ringColor, flagColor}) {
			const showTL = new TimelineLite();

			showTL.set(this, {
				'--gdq-omnibar-label-ring-color': ringColor,
				'--gdq-omnibar-label-flag-color': flagColor
			});

			showTL.set(this.$['avatar-icon'], {icon: `omnibar:${avatarIconName}`});
			showTL.set(this.$['flag-text'], {textContent: text});

			showTL.add(MaybeRandom.createTween({
				target: this.$.avatar.style,
				propName: 'opacity',
				duration: 0.465,
				start: {probability: 1, normalValue: 1},
				end: {probability: 0, normalValue: 1}
			}));

			showTL.add(this.playFlag(flagHoldDuration));
			showTL.call(() => {
				this._showing = true;
			});

			return showTL;
		}

		/**
		 * Creates an animation timeline for changing the label.
		 * This should only be called after `.show()`.
		 * @param {String} text - The text to show.
		 * @param {LabelShowAndChangeOptions} options - Options for this animation.
		 * @returns {TimelineLite} - An animation timeline.
		 */
		change(text, {avatarIconName, flagHoldDuration, ringColor, flagColor}) {
			const changeTL = new TimelineLite();

			changeTL.add(this.playFlag(flagHoldDuration), 0);

			changeTL.to(this.$['avatar-icon'], 0.182, {
				opacity: 0,
				ease: Sine.easeIn,
				callbackScope: this,
				onComplete() {
					this.$['avatar-icon'].icon = `omnibar:${avatarIconName}`;
					this.$['flag-text'].textContent = text;
					MaybeRandom.createTween({
						target: this.$['avatar-icon'].style,
						propName: 'opacity',
						duration: 0.465,
						start: {probability: 1, normalValue: 1},
						end: {probability: 0, normalValue: 1}
					});
				}
			}, 0);

			/* This is a bandaid fix for issues caused by all the time-traveling and
			 * pausing we do in gdq-omnibar.
			 *
			 * It appears that when calling .resume(), GSAP sometimes wants to restore its last
			 * known snapshot of the world. This normally is fine and doesn't cause any issues.
			 * However, the `MaybeRandom` tween we create above doesn't update GSAP's knowledge
			 * of the world state, due to it doing all of its work in the `onUpdate` callback.
			 *
			 * The fix here is to call .set to forcibly update GSAP's snapshot of the world.
			 * This .set is never visible in the actual graphic, because the MaybeRandom tween
			 * immediately overwrites the opacity that we are setting. But, it's enough to update
			 * GSAP's snapshot, which prevents the opacity from reverting back to zero when we
			 * later pause, edit, and resume the timeline in gdq-omnibar.
			 */
			changeTL.set(this.$['avatar-icon'], {opacity: 1});

			changeTL.to(this.$['avatar-ring'], FLAG_ENTRANCE_DURATION, {
				rotation: '+=360',
				ease: Sine.easeInOut
			}, 0);

			changeTL.to(this, FLAG_ENTRANCE_DURATION, {
				'--gdq-omnibar-label-ring-color': ringColor,
				'--gdq-omnibar-label-flag-color': flagColor,
				ease: Sine.easeInOut
			}, 0);

			return changeTL;
		}

		/**
		 * Shows, holds, and hides the label flag.
		 * @param {Number} holdDuration - How long, in seconds, to display the flag before hiding it.
		 * @returns {TimelineLite} - An animation timeline.
		 */
		playFlag(holdDuration) {
			const playFlagTL = new TimelineLite();

			playFlagTL.addLabel('enter');
			playFlagTL.addLabel('exit', `enter+=${holdDuration}`);

			// Enter.
			playFlagTL.to(this.$.avatar, 0.232, {
				x: 5,
				ease: Sine.easeInOut
			}, 'enter');
			playFlagTL.fromTo(this.$.flag, FLAG_ENTRANCE_DURATION, {
				clipPath: 'inset(0 100% 0 0)'
			}, {
				clipPath: 'inset(0 0% 0 0)',
				immediateRender: false,
				ease: Sine.easeInOut
			}, 'enter');

			// Exit.
			playFlagTL.fromTo(this.$.flag, FLAG_ENTRANCE_DURATION, {
				clipPath: 'inset(0 0% 0 0)'
			}, {
				clipPath: 'inset(0 100% 0 0)',
				immediateRender: false,
				ease: Sine.easeInOut
			}, 'exit');
			playFlagTL.to(this.$.avatar, 0.232, {
				x: 0,
				ease: Sine.easeInOut
			}, `exit+=${FLAG_ENTRANCE_DURATION - 0.232}`);

			return playFlagTL;
		}

		/**
		 * Creates an animation timeline for hiding the label.
		 * @returns {TimelineLite} - An animation timeline.
		 */
		hide() {
			const hideTL = new TimelineLite();

			hideTL.to(this.$.avatar, 0.434, {
				opacity: 0,
				ease: SlowMo.ease.config(0.5, 0.7, false)
			});

			hideTL.call(() => {
				this._showing = false;
			});

			return hideTL;
		}
	}

	customElements.define(GdqOmnibarLabel.is, GdqOmnibarLabel);
})();
