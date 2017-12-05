(function () {
	'use strict';

	const NAME_FADE_DURATION = 0.33;
	const NAME_FADE_IN_EASE = Power1.easeOut;
	const NAME_FADE_OUT_EASE = Power1.easeIn;
	const currentRun = nodecg.Replicant('currentRun');
	const stopwatch = nodecg.Replicant('stopwatch');
	const gameAudioChannels = nodecg.Replicant('gameAudioChannels');

	class GdqNameplate extends Polymer.Element {
		static get is() {
			return 'gdq-nameplate';
		}

		static get properties() {
			return {
				index: Number,
				audioVertPos: String,
				audioHorizPos: String,
				audio: {
					type: Boolean,
					reflectToAttribute: true,
					value: false
				},
				resultSide: String,
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
				coop: {
					type: Boolean,
					reflectToAttribute: true
				},
				finished: {
					type: Boolean,
					reflectToAttribute: true,
					value: false
				},
				forfeit: {
					type: Boolean,
					reflectToAttribute: true,
					value: false
				},
				time: String,
				place: Number,
				firstPlace: {
					type: Boolean,
					computed: '_computeFirstPlace(place)'
				},
				lastPlace: {
					type: Boolean,
					computed: '_computeLastPlace(place, _numRunners)'
				},
				name: {
					type: String,
					value: ''
				},
				twitch: {
					type: String,
					value: ''
				},
				_numRunners: {
					type: Number,
					value: 1
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

			this.currentRunChanged = this.currentRunChanged.bind(this);
			this.stopwatchChanged = this.stopwatchChanged.bind(this);
			this.gameAudioChannelsChanged = this.gameAudioChannelsChanged.bind(this);

			// Create looping anim for main nameplate.
			this._nameTL.to(this.$.names, NAME_FADE_DURATION, {
				onStart: function () {
					this.$.namesTwitch.classList.remove('hidden');
					this.$.namesName.classList.add('hidden');
				}.bind(this),
				opacity: 1,
				ease: NAME_FADE_IN_EASE
			});
			this._nameTL.to(this.$.names, NAME_FADE_DURATION, {
				opacity: 0,
				ease: NAME_FADE_OUT_EASE
			}, '+=10');
			this._nameTL.to(this.$.names, NAME_FADE_DURATION, {
				onStart: function () {
					this.$.namesTwitch.classList.add('hidden');
					this.$.namesName.classList.remove('hidden');
				}.bind(this),
				opacity: 1,
				ease: NAME_FADE_IN_EASE
			});
			this._nameTL.to(this.$.names, NAME_FADE_DURATION, {
				opacity: 0,
				ease: NAME_FADE_OUT_EASE
			}, '+=80');

			// Attach replicant change listeners.
			currentRun.on('change', this.currentRunChanged);
			stopwatch.on('change', this.stopwatchChanged);
			gameAudioChannels.on('change', this.gameAudioChannelsChanged);
		}

		/*
		 * 1) For singleplayer, if both match (ignoring capitalization), show only twitch.
		 * 2) For races, if everyone matches (ignoring capitalization), show only twitch, otherwise,
		 *    if even one person needs to show both, everyone shows both.
		 */
		currentRunChanged(newVal, oldVal) {
			if (!newVal || typeof newVal !== 'object') {
				return;
			}

			this.coop = newVal.coop;
			this._numRunners = newVal.runners.length;

			// Only invoke updateNames if the names could have changed.
			if (!oldVal || JSON.stringify(newVal.runners) !== JSON.stringify(oldVal.runners)) {
				this.updateNames(newVal.runners);
			}
		}

		updateNames(runners) {
			let canConflateAllRunners = true;
			runners.forEach(runner => {
				if (runner) {
					if (!runner.stream || runner.name.toLowerCase() !== runner.stream.toLowerCase()) {
						canConflateAllRunners = false;
					}
				}
			});

			TweenLite.to(this.$.names, NAME_FADE_DURATION, {
				opacity: 0,
				ease: NAME_FADE_OUT_EASE,
				callbackScope: this,
				onComplete() {
					this.$.namesName.classList.add('hidden');
					this.$.namesTwitch.classList.remove('hidden');

					const runner = runners[this.index];
					if (runner) {
						this.name = runner.name;

						if (runner.stream) {
							this.twitch = runner.stream;
						} else {
							this.twitch = '';
						}
					} else {
						this.name = '?';
						this.twitch = '?';
					}

					if (!this.twitch) {
						this._nameTL.pause();
						this.$.namesName.classList.remove('hidden');
						this.$.namesTwitch.classList.add('hidden');
						TweenLite.to(this.$.names, NAME_FADE_DURATION, {opacity: 1, ease: NAME_FADE_IN_EASE});
					} else if (canConflateAllRunners) {
						this._nameTL.pause();
						TweenLite.to(this.$.names, NAME_FADE_DURATION, {opacity: 1, ease: NAME_FADE_IN_EASE});
					} else {
						this._nameTL.restart();
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

		stopwatchChanged(newVal) {
			if (newVal.results[this.index]) {
				this.forfeit = newVal.results[this.index].forfeit;
				this.place = newVal.results[this.index].place;
				this.time = newVal.results[this.index].time.formatted;
				this.finished = true;
			} else {
				this.forfeit = false;
				this.finished = false;
			}
		}

		gameAudioChannelsChanged(newVal) {
			if (!newVal || newVal.length <= 0) {
				return;
			}

			const channels = newVal[this.index];
			const canHearSd = !channels.sd.muted && !channels.sd.fadedBelowThreshold;
			const canHearHd = !channels.hd.muted && !channels.hd.fadedBelowThreshold;
			this.audio = canHearSd || canHearHd;
		}

		_computeFirstPlace(place) {
			return place === 1;
		}

		_computeLastPlace(place, numRunners) {
			return place === numRunners;
		}
	}

	customElements.define(GdqNameplate.is, GdqNameplate);
})();
