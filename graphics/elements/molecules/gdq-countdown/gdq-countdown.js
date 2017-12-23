(function () {
	'use strict';

	const countdownRunning = nodecg.Replicant('countdownRunning');
	const countdownTime = nodecg.Replicant('countdown');
	const nowPlaying = nodecg.Replicant('nowPlaying');

	/**
	 * @customElement
	 * @polymer
	 */
	class GdqCountdown extends Polymer.Element {
		static get is() {
			return 'gdq-countdown';
		}

		static get properties() {
			return {
				importPath: String, // https://github.com/Polymer/polymer-linter/issues/71
				_countdownTimeline: {
					type: TimelineLite,
					readOnly: true,
					value() {
						return new TimelineLite({autoRemoveChildren: true});
					}
				},
				_nowPlayingTimeline: {
					type: TimelineLite,
					readOnly: true,
					value() {
						return new TimelineLite({autoRemoveChildren: true});
					}
				}
			};
		}

		ready() {
			super.ready();
			TweenLite.set(this.$.countdown, {opacity: 0});

			countdownRunning.on('change', newVal => {
				if (newVal) {
					this.showTimer();
				} else {
					this._debounceFoo();
				}
			});

			countdownTime.on('change', newVal => {
				this.$.countdownMinutesTens.innerText = Math.floor(newVal.minutes / 10);
				this.$.countdownMinutesOnes.innerText = newVal.minutes % 10;
				this.$.countdownSecondsTens.innerText = Math.floor(newVal.seconds / 10);
				this.$.countdownSecondsOnes.innerText = newVal.seconds % 10;

				if (newVal.raw <= 60000) {
					if (!this._didTweenRed) {
						this._didTweenRed = true;
						this._didTweenTeal = false;
						TweenLite.to(this.$.countdown, 1, {
							color: '#ED5A5A',
							ease: Sine.easeInOut
						});
					}
				} else {
					if (!this._didTweenTeal) { // eslint-disable-line no-lonely-if
						this._didTweenRed = false;
						this._didTweenTeal = true;
						TweenLite.to(this.$.countdown, 1, {
							color: '#00FFFF',
							ease: Sine.easeInOut
						});
					}
				}

				if (newVal.raw <= 0) {
					this.$.countdown.classList.add('blink');
					this._debounceFoo();
				} else {
					this.$.countdown.classList.remove('blink');
				}
			});

			nowPlaying.on('change', newVal => {
				this.$.nowPlaying.textContent = `${newVal.game || '?'} - ${newVal.title || '?'}`;
				TypeAnims.type(this.$.nowPlaying);
			});
		}

		showTimer() {
			if (!this._initialized) {
				this._initialized = true;
			}

			clearTimeout(this._fooTimeout);

			const tl = this._countdownTimeline;

			tl.add(MaybeRandom.createTween({
				target: this.$.pressStart.style,
				propName: 'opacity',
				duration: 0.465,
				start: {probability: 1, normalValue: 1},
				end: {probability: 0, normalValue: 0}
			}), 'flickerTotal');

			tl.set(this.$.countdown, {opacity: 1});
			tl.staggerFromTo([
				this.$.countdownMinutesTens,
				this.$.countdownMinutesOnes,
				this.$.countdownColon,
				this.$.countdownSecondsTens,
				this.$.countdownSecondsOnes
			], 0.001, {
				visibility: 'hidden'
			}, {
				visibility: 'visible'
			}, 0.03);
		}

		hideTimer() {
			if (!this._initialized) {
				this._initialized = true;
				return;
			}

			const tl = this._countdownTimeline;

			tl.add(MaybeRandom.createTween({
				target: this.$.countdown.style,
				propName: 'opacity',
				duration: 0.465,
				start: {probability: 1, normalValue: 1},
				end: {probability: 0, normalValue: 0}
			}), 'flickerTotal');

			tl.set(this.$.pressStart, {opacity: 1});
			tl.add(TypeAnims.type(this.$.pressStart));
		}

		_debounceFoo() {
			this._fooDebouncer = Polymer.Debouncer.debounce(
				this._fooDebouncer,
				Polymer.Async.timeOut.after(300),
				this._foo.bind(this)
			);
		}

		_foo() {
			clearTimeout(clearTimeout(this._fooTimeout));
			if (countdownRunning.value === false) {
				if (countdownTime.value.raw <= 0) {
					this._fooTimeout = setTimeout(() => {
						this.hideTimer();
					}, 120);
				} else {
					this.hideTimer();
				}
			}
		}
	}

	customElements.define(GdqCountdown.is, GdqCountdown);
})();
