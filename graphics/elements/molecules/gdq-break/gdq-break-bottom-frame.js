(function () {
	'use strict';

	const FADE_DURATION = 0.334;
	const FADE_OUT_EASE = Power1.easeIn;
	const FADE_IN_EASE = Power1.easeOut;

	const currentHost = nodecg.Replicant('currentHost');
	const nowPlaying = nodecg.Replicant('nowPlaying');

	/**
	 * @customElement
	 * @polymer
	 */
	class GdqBreakBottomFrame extends Polymer.Element {
		static get is() {
			return 'gdq-break-bottom-frame';
		}

		static get properties() {
			return {
				importPath: String // https://github.com/Polymer/polymer-linter/issues/71
			};
		}

		ready() {
			super.ready();

			currentHost.on('change', newVal => {
				this._changeText(this.$['host-text'], newVal);
			});

			nowPlaying.on('change', newVal => {
				this._changeText(this.$['music-text'], `${newVal.game || '?'} - ${newVal.title || '?'}`);
			});
		}

		_changeText(element, newText) {
			TweenLite.to(element, FADE_DURATION, {
				opacity: 0,
				ease: FADE_OUT_EASE,
				callbackScope: this,
				onComplete() {
					element.text = newText;
					TweenLite.to(element, FADE_DURATION, {
						opacity: 1,
						ease: FADE_IN_EASE,
						delay: 0.05
					});
				}
			});
		}
	}

	customElements.define(GdqBreakBottomFrame.is, GdqBreakBottomFrame);
})();
