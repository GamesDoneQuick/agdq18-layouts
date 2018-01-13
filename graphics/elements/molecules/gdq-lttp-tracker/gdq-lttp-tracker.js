(function () {
	'use strict';

	const urlParams = new URLSearchParams(window.location.search);
	const MIRROR_MODE = getBooleanUrlParam(urlParams, 'mirrored');
	const GAME_ID = urlParams.has('game_id') ? urlParams.get('game_id') : 'supportclass';
	if (MIRROR_MODE) {
		document.title = `${document.title} (Mirrored)`;
	}

	function getBooleanUrlParam(urlParams, paramName) {
		return urlParams.has(paramName) && urlParams.get(paramName) !== 'false' && urlParams.get(paramName) !== '0';
	}

	const ITEM_ROWS = [[
		{name: 'hookshot'},
		{name: 'silvers'},
		{name: 'bow'},
		{name: 'boss0'}
	], [
		{name: 'firerod'},
		{name: 'somaria'},
		{name: 'hammer'},
		{name: 'boss1'}
	], [
		{name: 'icerod'},
		{name: 'byrna'},
		{name: 'flute'},
		{name: 'boss2'}
	], [
		{name: 'quake'},
		{name: 'ether'},
		{name: 'bombos'},
		{name: 'boss3'}
	], [
		{name: 'boots'},
		{name: 'moonpearl'},
		{name: 'glove', hasLevels: true}, // has 2 variants (0-2)
		{name: 'boss4'}
	], [
		{name: 'flippers'},
		{name: 'mirror'},
		{name: 'lantern'},
		{name: 'boss5'}
	], [
		{name: 'powder'},
		{name: 'book'},
		{name: 'bottle', hasLevels: true}, // can be 0-4
		{name: 'boss6'}
	], [
		{name: 'mushroom'},
		{name: 'shovel'},
		{name: 'net'},
		{name: 'boss7'}
	], [
		{name: 'tunic', hasLevels: true}, // can be 1-3
		{name: 'shield', hasLevels: true}, // can be 0-3
		{name: 'sword', hasLevels: true}, // can be 0-4
		{name: 'boss8'}
	], [
		{name: 'cape'},
		{name: 'boomerang', hasLevels: true}, // can be 0-3
		{name: 'boss10'},
		{name: 'boss9'}
	]];

	/**
	 * @customElement
	 * @polymer
	 */
	class GdqLttpTracker extends Polymer.Element {
		static get is() {
			return 'gdq-lttp-tracker';
		}

		static get properties() {
			return {
				importPath: String, // https://github.com/Polymer/polymer-linter/issues/71
				itemsAndPrizes: {
					type: Array
				},
				gameId: {
					type: String,
					value: GAME_ID
				},
				items: {
					type: Object
				},
				prizes: {
					type: Object
				},
				medallions: {
					type: Array
				},
				mirrored: {
					type: Boolean,
					reflectToAttribute: true,
					value: MIRROR_MODE
				}
			};
		}

		static get observers() {
			return [
				'_computeItemsAndPrizes(items.*, prizes.*, medallions.*)'
			];
		}

		ready() {
			super.ready();

			this.$.auth.signInAnonymously().then(() => {
				nodecg.log.info('Signed in anonymously.');
			}).catch(error => {
				nodecg.log.error('Failed to sign in:', error);
			});
		}

		_computeItemsAndPrizes() {
			const finalArray = [];
			const items = this.items;
			const prizes = this.prizes;
			const medallions = this.medallions;

			if (!items || items.length <= 0 ||
				!prizes || prizes.length <= 0 ||
				!medallions || medallions.length <= 0) {
				this.itemsAndPrizes = finalArray;
				return;
			}

			console.log('prizes:', this.prizes);
			console.log('medallions:', this.medallions);

			ITEM_ROWS.forEach((row, rowIndex) => {
				row.forEach((item, itemIndex) => {
					const itemValue = items[item.name];

					if (itemIndex === 3) {
						// Empty placeholder for the 4th column, which is blank.
						finalArray.push({});
					}

					finalArray.push({
						name: item.name,
						hasLevels: item.hasLevels,
						level: itemValue,
						dimmed: item.name.startsWith('boss') ?
							itemValue === 1 :
							itemValue === 0 || itemValue === false
					});
				});

				// Dungeon prize.
				const dungeonInfo = {
					name: 'dungeon',
					hasLevels: true,
					level: prizes[rowIndex],
					dimmed: false
				};

				// Only these two bosses have medallion info.
				if (rowIndex === 8 || rowIndex === 9) {
					dungeonInfo.medallionLevel = medallions[rowIndex];
				}

				finalArray.push(dungeonInfo);
			});

			this.itemsAndPrizes = finalArray;
		}

		_calcCellClass(itemOrPrize, index) {
			const classes = new Set(['cell']);
			const sixesRemainder = (index + 1) % 6;

			if (itemOrPrize.dimmed) {
				classes.add('cell--dimmed');
			}

			if (sixesRemainder === 0) {
				classes.add('cell--prize');
			} else if (sixesRemainder === 4) {
				classes.add('cell--zeroWidth');
			}

			return Array.from(classes).join(' ');
		}

		_calcCellSrc(itemOrPrize) {
			let src = itemOrPrize.name;

			if (itemOrPrize.hasLevels) {
				if (typeof itemOrPrize.level === 'number') {
					src += itemOrPrize.level;
				} else {
					return 'blank-pixel';
				}
			}

			return src ? src : 'blank-pixel';
		}

		_hasMedallion(itemOrPrize) {
			return 'medallionLevel' in itemOrPrize;
		}

		_calcCellMedallionSrc(itemOrPrize) {
			if (itemOrPrize.name !== 'dungeon') {
				return 'blank-pixel';
			}

			return `medallion${itemOrPrize.medallionLevel}`;
		}
	}

	customElements.define(GdqLttpTracker.is, GdqLttpTracker);
})();
