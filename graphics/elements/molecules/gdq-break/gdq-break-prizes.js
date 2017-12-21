/* global SplitText Random */
(function () {
	'use strict';

	const TYPE_INTERVAL = 0.03;
	const EMPTY_OBJ = {};
	const DISPLAY_DURATION = nodecg.bundleConfig.displayDuration;

	const currentPrizes = nodecg.Replicant('currentPrizes');
	const preloadedImages = new Set();
	const preloaderPromises = new Map();

	/**
	 * @customElement
	 * @polymer
	 */
	class GdqBreakPrizes extends Polymer.Element {
		static get is() {
			return 'gdq-break-prizes';
		}

		static get properties() {
			return {
				currentPrize: Object
			};
		}

		ready() {
			super.ready();
			this._fallbackImageUrl = `${this.importPath}img/prize-fallback.png`;
			this.initPhotoSVG();
			this.loop();
		}

		initPhotoSVG() {
			const STROKE_SIZE = 1;
			const ELEMENT_WIDTH = this.$.photo.clientWidth;
			const ELEMENT_HEIGHT = this.$.photo.clientHeight;
			const IMAGE_MASK_CELL_SIZE = 21;
			const IMAGE_MASK_ROWS = Math.ceil(ELEMENT_HEIGHT / IMAGE_MASK_CELL_SIZE);
			const IMAGE_MASK_COLUMNS = Math.ceil(ELEMENT_WIDTH / IMAGE_MASK_CELL_SIZE);

			const svgDoc = SVG(this.$.photo);
			const bgRect = svgDoc.rect();
			const mask = svgDoc.mask();
			const image = svgDoc.image(this._fallbackImageUrl);

			this._image = image;
			this._imageMaskCells = [];

			svgDoc.size(ELEMENT_WIDTH, ELEMENT_HEIGHT);
			svgDoc.style('position', 'absolute');
			svgDoc.style('top', '0px');
			svgDoc.style('left', '0px');

			bgRect.size(ELEMENT_WIDTH, ELEMENT_HEIGHT);
			bgRect.stroke({
				color: 'white',
				width: STROKE_SIZE * 2 // Makes it effectively STROKE_SIZE, because all SVG strokes are center strokes, and the outer half is cut off.
			});
			bgRect.fill({color: 'black', opacity: 0.25});

			image.size(ELEMENT_WIDTH - (STROKE_SIZE * 2), ELEMENT_HEIGHT - (STROKE_SIZE * 2));
			image.move(STROKE_SIZE, STROKE_SIZE);
			image.attr({preserveAspectRatio: 'xMidYMid slice'});

			// Generate the exitMask rects
			for (let r = 0; r < IMAGE_MASK_ROWS; r++) {
				const y = r * IMAGE_MASK_CELL_SIZE;
				for (let c = 0; c < IMAGE_MASK_COLUMNS; c++) {
					const x = c * IMAGE_MASK_CELL_SIZE;
					const rect = svgDoc.rect(IMAGE_MASK_CELL_SIZE, IMAGE_MASK_CELL_SIZE);
					rect.move(x, y);
					rect.fill({color: '#FFFFFF'});
					mask.add(rect);
					this._imageMaskCells.push(rect);
				}
			}

			image.maskWith(mask);
		}

		loop() {
			// If there's no prizes, do nothing and try again in one second.
			if (!currentPrizes.value || currentPrizes.value.length <= 0) {
				setTimeout(() => {
					this.loop();
				}, 1000);
				return;
			}

			const availablePrizes = currentPrizes.value;

			let nextIdx = 0;
			if (this.currentPrize && this.currentPrize.id) {
				// Figure out the array index of the current sponsor
				let currentIdx = -1;
				availablePrizes.some((prize, index) => {
					if (prize.id === this.currentPrize.id) {
						currentIdx = index;
						return true;
					}

					return false;
				});

				nextIdx = currentIdx + 1;
			}

			// If this index is greater than the max, loop back to the start
			if (nextIdx >= availablePrizes.length) {
				nextIdx = 0;
			}

			const nextPrize = availablePrizes[nextIdx];

			// If the next prize is the same as the current prize, do nothing and try again in one second.
			if (this.currentPrize && nextPrize.id === this.currentPrize.id) {
				setTimeout(() => {
					this.loop();
				}, 1000);
				return;
			}

			// Show the next prize.
			this.currentPrize = nextPrize;
			const tl = this.showPrize(nextPrize);
			tl.call(() => {
				this.loop();
			});
		}

		showPrize(prize) {
			let useFallbackImage = false;
			let changingProvider = true;
			let changingMinimumBid = true;
			const imageExitCells = Random.shuffle(Random.engines.browserCrypto, this._imageMaskCells.slice(0));
			const imageEntranceCells = Random.shuffle(Random.engines.browserCrypto, this._imageMaskCells.slice(0));
			const tl = new TimelineLite();
			const minimumBidText = prize.sumdonations ?
				`${prize.minimumbid} in Total Donations` :
				`${prize.minimumbid} Single Donation`;

			tl.call(() => {
				tl.pause();
				this._preloadImage(prize.image).then(() => {
					tl.resume();
				}).catch(error => {
					nodecg.log.error(error);
					useFallbackImage = true;
					tl.resume();
				});
			}, null, null, '+=0.03');

			tl.addLabel('exit');

			tl.call(() => {
				if (!this.$.provider.innerText && !this.$['info-description-text'].innerText) {
					return;
				}

				changingProvider = false;
				if (this.$.provider.innerText.trim() !== prize.provided) {
					changingProvider = true;
					TweenLite.to(this.$.provider, 0.5, {
						opacity: 0,
						ease: Sine.easeInOut
					});
				}

				changingMinimumBid = false;
				if (this.$['info-minimumBid-text'].innerText.trim() !== minimumBidText) {
					changingMinimumBid = true;
					TweenLite.to(this.$['info-minimumBid-text'], 0.5, {opacity: 0, ease: Sine.easeInOut});
				}

				TweenLite.to(this.$['info-description-text'], 0.5, {
					opacity: 0,
					ease: Sine.easeInOut
				});
			}, null, null, 'exit+=0.1');

			tl.staggerTo(imageExitCells, 0.224, {
				opacity: 0,
				ease: Sine.easeInOut
			}, 0.002, 'exit');

			tl.call(() => {
				const newSrc = useFallbackImage ? this._fallbackImageUrl : prize.image;
				tl.pause();
				this._image.load(newSrc).loaded(() => {
					tl.resume();
				});
			});

			tl.addLabel('enter');

			tl.call(() => {
				if (!changingProvider) {
					return;
				}

				this.$.provider.innerText = prize.provided;
				this._typeAnim(this.$.provider);
				TweenLite.set(this.$.provider, {opacity: 1});
			}, null, null, 'enter');

			tl.staggerTo(imageEntranceCells, 0.224, {
				opacity: 1,
				ease: Sine.easeInOut
			}, 0.002, 'enter+=0.1');

			tl.call(() => {
				this.$['info-description-text'].innerText = prize.description;
				this._typeAnim(this.$['info-description-text']);
				TweenLite.set(this.$['info-description-text'], {opacity: 1});
			}, null, null, 'enter+=0.2');

			tl.call(() => {
				if (!changingMinimumBid) {
					return;
				}

				this.$['info-minimumBid-text'].innerText = minimumBidText;
				this._typeAnim(this.$['info-minimumBid-text']);
				TweenLite.set(this.$['info-minimumBid-text'], {opacity: 1});
			}, null, null, 'enter+=0.3');

			// Give the prize some time to show
			tl.to(EMPTY_OBJ, DISPLAY_DURATION, EMPTY_OBJ);

			return tl;
		}

		_typeAnim(element, {splitType = 'chars,words'} = {}) {
			const tl = new TimelineLite();
			const split = new SplitText(element, {
				type: splitType,
				charsClass: 'character style-scope gdq-break-bids',
				linesClass: 'line style-scope gdq-break-bids'
			});
			element.split = split;

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

		/**
		 * Preloads an image.
		 * @param {string} src - The URL of the new image to load.
		 * @returns {Promise} - A promise that is resolved if the load succeeds, and rejected it the load fails.
		 */
		_preloadImage(src) {
			if (preloadedImages.has(src)) {
				return Promise.resolve();
			}

			if (preloaderPromises.has(src)) {
				return preloaderPromises.get(src);
			}

			const preloadPromise = new Promise((resolve, reject) => {
				if (!src) {
					resolve();
					return;
				}

				const preloader = document.createElement('img');
				preloader.classList.add('image-preloader');

				const listeners = {
					load: null,
					error: null
				};

				listeners.load = function (event) {
					event.target.removeEventListener('error', listeners.error);
					event.target.removeEventListener('load', listeners.load);
					preloadedImages.add(src);
					resolve();
				};

				listeners.error = function (event) {
					event.target.removeEventListener('error', listeners.error);
					event.target.removeEventListener('load', listeners.load);
					reject(new Error(`Image failed to load: ${src}`));
				};

				preloader.addEventListener('load', listeners.load);
				preloader.addEventListener('error', listeners.error);

				preloader.src = src;
			});

			preloaderPromises.set(src, preloadPromise);
			return preloadPromise;
		}
	}

	customElements.define(GdqBreakPrizes.is, GdqBreakPrizes);
})();
