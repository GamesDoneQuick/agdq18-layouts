/* global SplitText */
(function () {
	'use strict';

	const TYPE_INTERVAL = 0.03;
	const EMPTY_OBJ = {};
	const displayDuration = nodecg.bundleConfig.displayDuration;
	const currentPrizes = nodecg.Replicant('currentPrizes');

	/**
	 * Loads a new src into an iron-image.
	 * @param {iron-image} target - The iron-image element to load the new src into.
	 * @param {string} src - The URL of the new image to load.
	 * @returns {Promise} - A promise that is resolved if the load succeeds, and rejected it the load fails.
	 */
	function loadImage(target, src) {
		return new Promise((resolve, reject) => {
			if (target.tagName !== 'IRON-IMAGE') {
				reject(new Error(`Must provide an iron-image element, you provided a "${target.tagName}".`));
				return;
			}

			target.src = src;
			if (target.loaded || !src) {
				resolve();
			} else {
				const listeners = {
					loaded: null,
					error: null
				};

				listeners.loaded = function (event) {
					event.target.removeEventListener('loaded-changed', listeners.error);
					event.target.removeEventListener('loaded-changed', listeners.loaded);
					if (event.detail.value) {
						resolve();
					} else {
						reject(new Error(`Image failed to load: ${src}`));
					}
				};

				listeners.error = function (event) {
					if (event.detail.value) {
						event.target.removeEventListener('error-changed', listeners.error);
						event.target.removeEventListener('error-changed', listeners.loaded);
						reject(new Error(`Image failed to load: ${src}`));
					}
				};

				target.addEventListener('loaded-changed', listeners.loaded);
				target.addEventListener('error-changed', listeners.error);
			}
		});
	}

	class GdqBreakPrizes extends Polymer.Element {
		static get is() {
			return 'gdq-break-prizes';
		}

		static get properties() {
			return {
				hidden: {
					type: Boolean,
					reflectToAttribute: true,
					observer: '_hiddenChanged'
				},
				tl: {
					type: TimelineLite,
					value() {
						return new TimelineLite({autoRemoveChildren: true});
					},
					readOnly: true
				},
				screenHeader: {
					type: String,
					value: 'COMMUNITY PRIZES',
					readOnly: true
				}
			};
		}

		_hiddenChanged(newVal) {
			if (newVal) {
				this.$['provider-wrap'].innerText = '';
				this.$['prize-name'].innerText = '';
			}
		}

		/**
		 * Returns whether or not there are any prizes to show at this time.
		 * @returns {boolean} - A bool.
		 */
		hasContent() {
			if (window._disablePrizes) {
				return false;
			}

			return this._calcPrizesToDisplay(currentPrizes.value).length > 0;
		}

		/**
		 * Adds an animation to the global timeline for showing the current prizes
		 * @returns {undefined}
		 */
		showContent() {
			return new Promise(resolve => {
				if (currentPrizes.value.length <= 0 || window._disablePrizes) {
					setTimeout(resolve, 0);
					return;
				}

				// Loop over each prize and queue it up on the timeline
				// Figure out what bids to display in this batch, then
				// loop over each bid and queue it up on the timeline
				const prizesToDisplay = this._calcPrizesToDisplay(currentPrizes.value);
				if (prizesToDisplay[0].grand) {
					this.lastShownGrandPrize = prizesToDisplay[0];
				}

				prizesToDisplay.forEach(this.showPrize, this);
				this.tl.call(resolve);
			});
		}

		/**
		 * Adds an animation to the global timeline for showing a specific prize.
		 * @param {Object} prize - The prize to display.
		 * @param {Number} index - The index of this prize in prizesArray.
		 * @param {Array} prizesArray - The parent array containing all the prizes being shown in this cycle.
		 * @returns {undefined}
		 */
		showPrize(prize, index, prizesArray) {
			this.tl.call(() => {
				this.tl.pause();
				loadImage(this.$['prize-image-next'], prize.image).then(() => {
					this.tl.resume();
				}).catch(error => {
					nodecg.log.error(error);
					this.$['prize-image-next'].src = '';
					this.tl.resume();
				});
			}, null, null, '+=0.1');

			let changingProvider = true;
			this.tl.call(() => {
				if (!this.$['provider-wrap'].innerText && !this.$['prize-name'].innerText) {
					return;
				}

				this.tl.pause();

				changingProvider = false;
				if (!this.$['provider-wrap'].innerText.trim().endsWith(prize.provided) && this.$['provider-wrap'].split) {
					changingProvider = true;
					this._untypeAnim(this.$['provider-wrap']).then(checkDone.bind(this));
				}

				if (this.$['prize-name'].split) {
					this._untypeAnim(this.$['prize-name']).then(checkDone.bind(this));
				}

				if (this.$['prize-minbid'].split) {
					this._untypeAnim(this.$['prize-minbid']).then(checkDone.bind(this));
				}

				let counter = 0;

				/**
				 * Resolves the promise once all the untype anims have finished.
				 * @returns {undefined}
				 */
				function checkDone() {
					counter++;
					if (!changingProvider && counter >= 2) {
						this.tl.resume();
					} else if (counter >= 3) {
						this.tl.resume();
					}
				}
			});

			this.tl.call(() => {
				if (!changingProvider) {
					return;
				}

				this.$['provider-wrap'].innerText = `Provided by: ${prize.provided}`;
				this._typeAnim(this.$['provider-wrap']);
			}, null, null, '+=0.1');

			this.tl.call(() => {
				this.$['prize-name'].innerText = prize.description;
				this._typeAnim(this.$['prize-name']);
			}, null, null, '+=0.1');

			this.tl.call(() => {
				this.$['prize-minbid'].innerHTML = prize.sumdonations ?
					`<div id="prize-minbid-amount">${prize.minimumbid}</div>&#x2005;in&#x2005;Total&#x2005;Donations` :
					`<div id="prize-minbid-amount">${prize.minimumbid}</div>&#x2005;Single&#x2005;Donation`;
				this._typeAnim(this.$['prize-minbid']);
			}, null, null, '+=0.1');

			this.tl.to(this.$['prize-image-next'], 0.667, {
				opacity: 1,
				ease: Power1.easeInOut
			});

			this.tl.to({}, 0.1, {
				onComplete() {
					// This will adopt either the known-good URL of a prize image, or an empty
					// string which will cause the fallback to show.
					this.$['prize-image-current'].src = this.$['prize-image-next'].src;
				},
				onCompleteScope: this
			}, '+=0.1');
			this.tl.set(this.$['prize-image-next'], {opacity: 0}, '+=0.1');

			// Give the prize some time to show
			this.tl.to(EMPTY_OBJ, displayDuration, {
				onStart() {
					if (index === 0) {
						this.$.disclaimer.style.opacity = 1;
					} else if (index === prizesArray.length - 1) {
						this.$.disclaimer.style.opacity = 0;
					}
				},
				onStartScope: this
			});

			if (index === 0 && prizesArray.length === 1) {
				this.tl.set(this.$.disclaimer.style, {opacity: 0});
			}
		}

		preloadFirstImage() {
			if (!currentPrizes.value || currentPrizes.value.length <= 0) {
				return;
			}

			this.$['prize-image-current'].src = currentPrizes.value[0].image;
		}

		_calcPrizesToDisplay(prizesArray) {
			return prizesArray.slice(0);
		}

		_typeAnim($el, {splitType = 'chars,words'} = {}) {
			const tl = new TimelineLite();
			const split = new SplitText($el, {
				type: splitType,
				charsClass: 'character style-scope gdq-break-bids',
				linesClass: 'line style-scope gdq-break-bids'
			});
			$el.split = split;

			switch (splitType) {
				case 'chars':
					tl.staggerFrom(split.chars, 0.001, {
						visibility: 'hidden'
					}, TYPE_INTERVAL);

					break;
				case 'chars,words':
				case 'chars,words,lines':
					split.words.forEach(word => {
						tl.staggerFrom(word.children, 0.001, {
							visibility: 'hidden'
						}, TYPE_INTERVAL);

						tl.to(EMPTY_OBJ, TYPE_INTERVAL, EMPTY_OBJ);
					});
					break;
				default:
					throw new Error(`Unexpected splitType "${splitType}"`);
			}

			return tl;
		}

		_untypeAnim($el) {
			return new Promise(resolve => {
				if (!$el.split) {
					return setTimeout(resolve, 0);
				}

				const tl = new TimelineLite({
					onComplete: resolve
				});

				const split = $el.split;

				if (split.words) {
					split.words.forEach(word => {
						tl.staggerTo(word.children, 0.001, {
							visibility: 'hidden'
						}, TYPE_INTERVAL);

						tl.to(EMPTY_OBJ, TYPE_INTERVAL, EMPTY_OBJ);
					});
				} else {
					tl.staggerFrom(split.chars, 0.001, {
						visibility: 'hidden'
					}, TYPE_INTERVAL);
				}

				return tl;
			});
		}
	}

	customElements.define(GdqBreakPrizes.is, GdqBreakPrizes);
})();
