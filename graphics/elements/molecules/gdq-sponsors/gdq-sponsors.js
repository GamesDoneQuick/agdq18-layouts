/* global GdqBreakLoop Random */
(function () {
	'use strict';

	const DISPLAY_DURATION = 45;
	const EMPTY_OBJ = {};

	class GdqSponsors extends GdqBreakLoop {
		static get is() {
			return 'gdq-sponsors';
		}

		static get properties() {
			return {
				_imageExiting: {
					type: Boolean,
					value: false,
					notify: true
				},
				_imageEntering: {
					type: Boolean,
					value: false,
					notify: true
				}
			};
		}

		ready() {
			this.itemIdField = 'sum';
			this.noAutoLoop = true;
			super.ready();

			let sponsors;
			const layoutName = window.location.pathname.split('/').pop();
			switch (layoutName) {
				case ('widescreen_1.html'):
				case ('gba_1.html'):
					sponsors = nodecg.Replicant('assets:sponsors-widescreen_1');
					break;
				default:
					sponsors = nodecg.Replicant('assets:sponsors-standard_1');
					break;
			}

			Polymer.RenderStatus.beforeNextRender(this, () => {
				this._initSVG();

				sponsors.on('change', newVal => {
					this.availableItems = newVal;

					// If no sponsor is showing yet, show the first sponsor immediately
					if (!this.currentItem && newVal.length > 0) {
						this.currentItem = newVal[0];
						this._image.load(newVal[0].url);
					}
				});

				this._loop();
			});
		}

		show() {
			const tl = new TimelineLite();

			tl.call(() => {
				// Clear all content.
				this._image.load('');
			}, null, null, '+=0.03');

			tl.to(this, 0.334, {
				opacity: 1,
				ease: Power1.easeIn
			});

			tl.call(() => {
				// Re-start the loop once we've finished entering.
				this._loop();
			});

			return tl;
		}

		hide() {
			const tl = new TimelineLite();

			tl.call(() => {
				tl.pause();
				if (this._imageExiting) {
					this.addEventListener('_image-exiting-changed', function listener(e) {
						if (e.detail.value === false) {
							this.removeEventListener('_image-exiting-changed', listener);
							this._killLoop();
							tl.resume();
						}
					});
				} else if (this._imageEntering) {
					this.addEventListener('_image-entering-changed', function listener(e) {
						if (e.detail.value === false) {
							this.removeEventListener('_image-entering-changed', listener);
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

			tl.to(this, 0.334, {
				opacity: 0,
				ease: Power1.easeOut
			});

			return tl;
		}

		_showItem(sponsorAsset) {
			const imageEntranceCells = Random.shuffle(Random.engines.browserCrypto, this._imageMaskCells.slice(0));
			const tl = new TimelineLite();

			tl.addLabel('exit');

			tl.add(this._exitPhoto({
				onComplete() {
					const newSrc = sponsorAsset.url;
					tl.pause();
					this._image.load(newSrc).loaded(() => {
						tl.resume();
					});
				}
			}), 'exit');

			tl.addLabel('enter');

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
					this._imageEntering = true;
				}
			}, 0.002, 'enter+=0.1', () => {
				this._imageEntering = false;
			});

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
					this._imageExiting = true;
				}
			}, 0.002, 0, () => {
				if (typeof onComplete === 'function') {
					onComplete.call(this);
				}
				this._imageExiting = false;
			});

			return tl;
		}

		_initSVG() {
			const ELEMENT_WIDTH = this.clientWidth;
			const ELEMENT_HEIGHT = this.clientHeight;
			const IMAGE_MASK_CELL_SIZE = 21;
			const IMAGE_MASK_ROWS = Math.ceil(ELEMENT_HEIGHT / IMAGE_MASK_CELL_SIZE);
			const IMAGE_MASK_COLUMNS = Math.ceil(ELEMENT_WIDTH / IMAGE_MASK_CELL_SIZE);

			const svgDoc = SVG(this.$.svgHost);
			const mask = svgDoc.mask();
			const image = svgDoc.image(`${this.importPath}img/blank-pixel.png`);

			this._image = image;
			this._imageMaskCells = [];

			svgDoc.size(ELEMENT_WIDTH, ELEMENT_HEIGHT);
			image.size(ELEMENT_WIDTH, ELEMENT_HEIGHT);

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
	}

	customElements.define(GdqSponsors.is, GdqSponsors);
})();
