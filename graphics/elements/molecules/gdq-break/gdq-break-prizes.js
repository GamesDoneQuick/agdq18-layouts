/* global Random GdqBreakLoop */
(function () {
	'use strict';

	const EMPTY_OBJ = {};
	const DISPLAY_DURATION = nodecg.bundleConfig.displayDuration;

	const currentPrizes = nodecg.Replicant('currentPrizes');
	const preloadedImages = new Set();
	const preloaderPromises = new Map();

	/**
	 * @customElement
	 * @polymer
	 */
	class GdqBreakPrizes extends GdqBreakLoop {
		static get is() {
			return 'gdq-break-prizes';
		}

		static get properties() {
			return {
				_photoExiting: {
					type: Boolean,
					value: false,
					notify: true
				},
				_photoEntering: {
					type: Boolean,
					value: false,
					notify: true
				}
			};
		}

		ready() {
			super.ready();

			currentPrizes.on('change', newVal => {
				this.availableItems = newVal;
			});

			this._fallbackImageUrl = `${this.importPath}img/prize-fallback.png`;
			this._initPhotoSVG();
		}

		/**
		 * Plays the entrance animation and kicks off the infinite loop of
		 * showing all available prizes, one at a time.
		 * @returns {TimelineLite} - A GSAP TimelineLite instance.
		 */
		show() {
			const tl = new TimelineLite();

			tl.call(() => {
				// Clear all content.
				this.$['info-description-text'].innerText = '';
				this.$['info-minimumBid-text'].innerText = '';
				this.$.provider.innerText = '';
				this._image.load('');
			}, null, null, '+=0.03');

			tl.addLabel('start');

			tl.to(this._photoBgRect.node, 1.5, {
				drawSVG: '100%',
				ease: Power2.easeOut
			}, 'start');

			tl.to(this.$.info, 1, {
				x: '0%',
				ease: Power2.easeOut
			}, 'start+=0.5');

			tl.to(this.$['photo-label'], 0.5, {
				opacity: 1,
				x: 0,
				ease: Sine.easeOut
			}, 'start+=1');

			tl.to(this._photoBgRect.node, 0.5, {
				'fill-opacity': 0.25,
				ease: Sine.easeOut
			}, 'start+=1');

			tl.call(() => {
				// Re-start the loop once we've finished entering.
				this._loop();
			});

			return tl;
		}

		/**
		 * Plays the exit animation and kills the current loop of prize displaying.
		 * This animation has a variable length due to it needing to wait for the current
		 * loop to be at a good stopping point before beginning the exit animation.
		 * @returns {TimelineLite} - A GSAP TimelineLite instance.
		 */
		hide() {
			const tl = new TimelineLite();

			tl.call(() => {
				tl.pause();
				if (this._photoExiting) {
					this.addEventListener('_photo-exiting-changed', function listener(e) {
						if (e.detail.value === false) {
							this.removeEventListener('_photo-exiting-changed', listener);
							this._killLoop();
							tl.resume();
						}
					});
				} else if (this._photoEntering) {
					this.addEventListener('_photo-entering-changed', function listener(e) {
						if (e.detail.value === false) {
							this.removeEventListener('_photo-entering-changed', listener);
							this._killLoop();
							this._exitPhoto({
								onComplete() {
									tl.resume();
								}
							});
						}
					});
				} else {
					this._killLoop();
					this._exitPhoto({
						onComplete() {
							tl.resume();
						}
					});
				}
			}, null, null, '+=0.1');

			tl.addLabel('start', '+=0.03');

			tl.to(this._photoBgRect.node, 0.5, {
				'fill-opacity': 0,
				ease: Sine.easeIn
			}, 'start');

			tl.to(this.$['photo-label'], 0.5, {
				opacity: 0,
				x: -50,
				ease: Sine.easeIn
			}, 'start');

			tl.to(this.$.info, 1, {
				x: '-100%',
				ease: Power2.easeIn
			}, 'start');

			tl.to(this._photoBgRect.node, 1.5, {
				drawSVG: '0%',
				ease: Power2.easeIn
			}, 'start');

			return tl;
		}

		_initPhotoSVG() {
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

			this._photoBgRect = bgRect;
			this._image = image;
			this._imageMaskCells = [];

			svgDoc.size(ELEMENT_WIDTH, ELEMENT_HEIGHT);
			svgDoc.style('position', 'absolute');
			svgDoc.style('top', '0px');
			svgDoc.style('left', '0px');

			bgRect.size(ELEMENT_WIDTH, ELEMENT_HEIGHT);
			bgRect.stroke({
				color: 'white',

				// Makes it effectively STROKE_SIZE, because all SVG strokes
				// are center strokes, and the outer half is cut off.
				width: STROKE_SIZE * 2
			});
			bgRect.fill({color: 'black', opacity: 0.25});

			// Mirror such that drawSVG anims start from the top right
			// and move clockwise to un-draw, counter-clockwise to draw.
			bgRect.transform({scaleX: -1, x: ELEMENT_WIDTH});

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

		_showItem(prize) {
			let useFallbackImage = !prize.image.trim();
			let changingProvider = true;
			let changingMinimumBid = true;
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

			tl.add(this._exitPhoto({
				onComplete() {
					const newSrc = useFallbackImage ? this._fallbackImageUrl : prize.image;
					tl.pause();
					this._image.load(newSrc).loaded(() => {
						tl.resume();
					});
				}
			}), 'exit');

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

			tl.addLabel('enter');

			tl.call(() => {
				if (!changingProvider) {
					return;
				}

				this.$.provider.innerText = prize.provided;
				TypeAnims.type(this.$.provider);
				TweenLite.set(this.$.provider, {opacity: 1});
			}, null, null, 'enter');

			let didImageEntranceOnStart;
			tl.staggerTo(imageEntranceCells, 0.224, {
				opacity: 1,
				ease: Sine.easeInOut,
				callbackScope: this,
				onStart() {
					// We only want this onStart handler to run once.
					// There is no "onStartAll" equivalent, only an "onCompleteAll".
					if (didImageEntranceOnStart) {
						return;
					}
					didImageEntranceOnStart = true;
					this._photoEntering = true;
				}
			}, 0.002, 'enter+=0.1', () => {
				this._photoEntering = false;
			});

			tl.call(() => {
				this.$['info-description-text'].innerText = prize.description;
				TypeAnims.type(this.$['info-description-text']);
				TweenLite.set(this.$['info-description-text'], {opacity: 1});
			}, null, null, 'enter+=0.2');

			tl.call(() => {
				if (!changingMinimumBid) {
					return;
				}

				this.$['info-minimumBid-text'].innerText = minimumBidText;
				TypeAnims.type(this.$['info-minimumBid-text']);
				TweenLite.set(this.$['info-minimumBid-text'], {opacity: 1});
			}, null, null, 'enter+=0.3');

			// Give the prize some time to show.
			tl.to(EMPTY_OBJ, DISPLAY_DURATION, EMPTY_OBJ);

			return tl;
		}

		_exitPhoto({onComplete} = {}) {
			const tl = new TimelineLite();
			const imageExitCells = Random.shuffle(Random.engines.browserCrypto, this._imageMaskCells.slice(0));
			let didOnStart = false;

			tl.staggerTo(imageExitCells, 0.224, {
				opacity: 0,
				ease: Sine.easeInOut,
				callbackScope: this,
				onStart() {
					// We only want this onStart handler to run once.
					// There is no "onStartAll" equivalent, only an "onCompleteAll".
					if (didOnStart) {
						return;
					}
					didOnStart = true;
					this._photoExiting = true;
				}
			}, 0.002, 0, () => {
				if (typeof onComplete === 'function') {
					onComplete.call(this);
				}
				this._photoExiting = false;
			});

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

		_resetState() {
			this._photoExiting = false;
		}
	}

	customElements.define(GdqBreakPrizes.is, GdqBreakPrizes);
})();
