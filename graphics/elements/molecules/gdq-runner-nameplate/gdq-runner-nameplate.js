(function () {
	'use strict';

	const currentRun = nodecg.Replicant('currentRun');
	const stopwatch = nodecg.Replicant('stopwatch');
	const gameAudioChannels = nodecg.Replicant('gameAudioChannels');

	/**
	 * @customElement
	 * @polymer
	 */
	class GdqRunnerNameplate extends Polymer.Element {
		static get is() {
			return 'gdq-runner-nameplate';
		}

		static get properties() {
			return {
				/* gdq-nameplate forwarded props */
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

				/* props specifically for gdq-runner-nameplate */
				index: Number,
				audioVertPos: String,
				audioHorizPos: String,
				audio: {
					type: Boolean,
					reflectToAttribute: true,
					value: false
				},
				noAudio: {
					type: Boolean,
					reflectToAttribute: true,
					value: false
				},
				resultSide: String,
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
				_numRunners: {
					type: Number,
					value: 1
				}
			};
		}

		ready() {
			super.ready();

			this.currentRunChanged = this.currentRunChanged.bind(this);
			this.stopwatchChanged = this.stopwatchChanged.bind(this);
			this.gameAudioChannelsChanged = this.gameAudioChannelsChanged.bind(this);

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

			const runner = runners[this.index];
			let alias;
			let twitchAlias;
			if (runner) {
				alias = runner.name;

				if (runner.stream) {
					twitchAlias = runner.stream;
				} else {
					twitchAlias = '';
				}
			} else {
				alias = '?';
				twitchAlias = '?';
			}

			this.$.nameplate.updateName({alias, twitchAlias, rotate: !canConflateAllRunners});
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
			if (this.noAudio) {
				return;
			}

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

	customElements.define(GdqRunnerNameplate.is, GdqRunnerNameplate);
})();
