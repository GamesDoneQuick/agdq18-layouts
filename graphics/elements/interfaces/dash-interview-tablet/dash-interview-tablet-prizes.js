(function () {
	'use strict';

	const allPrizesRep = nodecg.Replicant('allPrizes');
	const prizePlaylistRep = nodecg.Replicant('interview:prizePlaylist');
	const showPrizesOnMonitorRep = nodecg.Replicant('interview:showPrizesOnMonitor');
	const prizePlaylistSortMapRep = nodecg.Replicant('interview:prizePlaylistSortMap');

	/**
	 * @customElement
	 * @polymer
	 */
	class DashInterviewTabletPrizes extends Polymer.MutableData(Polymer.GestureEventListeners(Polymer.Element)) {
		static get is() {
			return 'dash-interview-tablet-prizes';
		}

		static get properties() {
			return {
				allPrizes: Array,
				prizePlaylist: Array,
				prizesShowingOnMonitor: {
					type: Boolean,
					value: false
				},
				searchString: {
					type: String,
					value: ''
				}
			};
		}

		ready() {
			super.ready();

			allPrizesRep.on('change', newVal => {
				this.allPrizes = newVal;
			});

			prizePlaylistRep.on('change', newVal => {
				this.prizePlaylist = newVal;
			});

			showPrizesOnMonitorRep.on('change', newVal => {
				this.prizesShowingOnMonitor = newVal;
			});

			prizePlaylistSortMapRep.on('change', (newVal, oldVal, operations) => {
				// If the new sortMap is equal to the currently rendered sort order, do nothing.
				if (JSON.stringify(newVal) === JSON.stringify(this._dragListOrder)) {
					return;
				}

				this._sortMapVal = newVal;
				this.notifyPath('prizePlaylist');

				if (newVal.length > 0) {
					this._flashBgIfAppropriate(operations);
				}

				this._dragListOrder = newVal.slice(0);
			});

			if (isMobileSafari()) {
				let start;
				Polymer.Gestures.addListener(this.$['list-container'], 'track', e => {
					if (e.detail.state === 'start') {
						start = this.$.list.scrollTop;
						console.log('updated start:', start);
						return;
					}

					if (this._dragging) {
						return;
					}

					this.$.list.scrollTop = Math.max(start - e.detail.dy, 0);
				});
			} else {
				// Hack to get around https://github.com/bevacqua/crossvent/issues/8
				// I dunno why but this prevents the "auto passive listener" thing.
				Polymer.Gestures.addListener(this.$['list-container'], 'track', () => {});
			}

			// Fades new question nodes from purple to white when added.
			this._listObserver = new MutationObserver(mutations => {
				mutations.forEach(mutation => {
					if (!mutation.addedNodes) {
						return;
					}

					Array.from(mutation.addedNodes).filter(node => {
						return node.classList && node.classList.contains('playlistPrize');
					}).forEach(node => {
						flushCss(node);
						node.style.backgroundColor = 'white';
					});
				});
			});
			this._listObserver.observe(this.$.playlist, {childList: true, subtree: true});
		}

		clearFilter() {
			this.searchString = '';
		}

		addPrizeToPlayList(prizeOrPrizeId) {
			const prizeId = disambiguatePrizeId(prizeOrPrizeId);
			nodecg.sendMessage('interview:addPrizeToPlaylist', prizeId);
		}

		removePrizeFromPlaylist(prizeOrPrizeId) {
			const prizeId = disambiguatePrizeId(prizeOrPrizeId);
			nodecg.sendMessage('interview:removePrizeFromPlaylist', prizeId);
		}

		markPrizeAsDone(prizeOrPrizeId) {
			const prizeId = disambiguatePrizeId(prizeOrPrizeId);
			nodecg.sendMessage('interview:markPrizeAsDone', prizeId);
		}

		markPrizeAsNotDone(prizeOrPrizeId) {
			const prizeId = disambiguatePrizeId(prizeOrPrizeId);
			nodecg.sendMessage('interview:markPrizeAsNotDone', prizeId);
		}

		clearPlaylist() {
			nodecg.sendMessage('interview:clearPrizePlaylist');
		}

		showPlaylist() {
			nodecg.sendMessage('interview:showPrizePlaylistOnMonitor');
		}

		hidePlaylist() {
			nodecg.sendMessage('interview:hidePrizePlaylistOnMonitor');
		}

		_calcClearIconHidden(searchString) {
			return !searchString || searchString.length <= 0;
		}

		_calcPrizesToList(allPrizes, searchString) {
			if (!allPrizes || allPrizes.length <= 0) {
				return [];
			}

			if (!searchString || searchString.trim().length === 0) {
				return allPrizes;
			}

			return allPrizes.filter(prize => {
				return prize.description.toLowerCase().includes(searchString.toLowerCase());
			});
		}

		_isPrizeInPlaylist(prizeOrPrizeId, prizePlaylist) {
			if (!prizePlaylist) {
				return false;
			}

			const prizeId = disambiguatePrizeId(prizeOrPrizeId);
			return prizePlaylist.findIndex(({id}) => id === prizeId) >= 0;
		}

		_calcClearPlaylistDisabled(prizePlaylist) {
			return !prizePlaylist || prizePlaylist.length <= 0;
		}

		_handlePrizeListingAddTap(e) {
			this.addPrizeToPlayList(e.model.prize);
		}

		_handlePrizeListingRemoveTap(e) {
			this.removePrizeFromPlaylist(e.model.prize);
		}

		_calcPrizesInPlaylist(allPrizes, prizePlaylist) {
			if (!allPrizes || allPrizes.length === 0 ||
				!prizePlaylist || prizePlaylist.length === 0) {
				return [];
			}

			return prizePlaylist.map(playlistEntry => {
				return allPrizes.find(prize => {
					return prize.id === playlistEntry.id;
				});
			});
		}

		_calcPlaylistPrizeChecked(prize, prizePlaylist) {
			if (!prize || !prizePlaylist || prizePlaylist.length <= 0) {
				return false;
			}

			const playlistEntry = prizePlaylist.find(pe => pe.id === prize.id);
			if (!playlistEntry) {
				return false;
			}

			return playlistEntry.complete;
		}

		_handlePlaylistPrizeCheckboxChanged(e) {
			if (e.detail.value) {
				this.markPrizeAsDone(e.model.prize);
			} else {
				this.markPrizeAsNotDone(e.model.prize);
			}
		}

		_flashBgIfAppropriate(operations) {
			if (operations && operations.length === 1) {
				// Don't flash if the change was just the addition of a new question.
				if (operations[0].method === 'push') {
					return;
				}

				// Don't flash if the change was just caused by hitting "Show Next" on tier2.
				if (operations[0].method === 'splice' && operations[0].args.length === 2 &&
					operations[0].args[0] === 0 && operations[0].args[1] === 1) {
					return;
				}
			}

			this.$.playlist.classList.remove('bg-color-transition');
			this.$.playlist.style.backgroundColor = '#9966cc';
			flushCss(this.$.playlist);
			this.$.playlist.classList.add('bg-color-transition');
			this.$.playlist.style.backgroundColor = 'transparent';
		}

		_handleDrag() {
			this._dragging = true;
		}

		_handleDragEnd() {
			this._dragging = false;
			const items = Array.from(this.$.playlist.querySelectorAll('.playlistPrize'));
			const newSortOrder = items.map(item => item.prizeId);
			this._dragListOrder = newSortOrder;
			this.$['playlist-repeat'].__instances.sort((a, b) => {
				const aMapIndex = newSortOrder.indexOf(a.__data.id);
				const bMapIndex = newSortOrder.indexOf(b.__data.id);

				if (aMapIndex >= 0 && bMapIndex < 0) {
					return -1;
				}

				if (aMapIndex < 0 && bMapIndex >= 0) {
					return 1;
				}

				// If neither of these prizes are in the sort map, just leave them where they are.
				if (aMapIndex < 0 && bMapIndex < 0) {
					return 0;
				}

				return aMapIndex - bMapIndex;
			});
			prizePlaylistSortMapRep.value = newSortOrder;
		}

		_mapSort(a, b) {
			if (!this._sortMapVal) {
				return 0;
			}

			const aMapIndex = this._sortMapVal.indexOf(a.id);
			const bMapIndex = this._sortMapVal.indexOf(b.id);

			if (aMapIndex >= 0 && bMapIndex < 0) {
				return -1;
			}

			if (aMapIndex < 0 && bMapIndex >= 0) {
				return 1;
			}

			// If neither of these replies are in the sort map, just leave them where they are.
			if (aMapIndex < 0 && bMapIndex < 0) {
				return 0;
			}

			return aMapIndex - bMapIndex;
		}
	}

	customElements.define(DashInterviewTabletPrizes.is, DashInterviewTabletPrizes);

	/**
	 * Given a prize Object or prize ID Number, will always return a prize ID Number.
	 * @param {Number|Object} prizeOrPrizeId - Either a prize Object or a prize ID Number.
	 * @returns {Number} - A prize ID Number.
	 */
	function disambiguatePrizeId(prizeOrPrizeId) {
		return typeof prizeOrPrizeId === 'object' ?
			prizeOrPrizeId.id :
			prizeOrPrizeId;
	}

	/**
	 * By reading the offsetHeight property, we are forcing
	 * the browser to flush the pending CSS changes (which it
	 * does to ensure the value obtained is accurate).
	 * @param {Object} element - The element to force a CSS flush on.
	 * @returns {undefined}
	 */
	function flushCss(element) {
		element.offsetHeight; // eslint-disable-line no-unused-expressions
	}

	/**
	 * Checks if the page is running in mobile Safari.
	 * @returns {boolean} - True if running in mobile Safari.
	 */
	function isMobileSafari() {
		return /iP(ad|hone|od).+Version\/[\d.]+.*Safari/i.test(navigator.userAgent);
	}
})();
