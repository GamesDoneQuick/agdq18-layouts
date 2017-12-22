/* eslint-env browser */
/* global TimelineLite SplitText */
(function () {
	'use strict';

	// A simple placeholder empty object used to create empty padding tweens.
	const EMPTY_OBJ = {};

	// Used to remember what splits and split types have previously been used on elements.
	const memoryMap = new WeakMap();

	/**
	 * Creates an animation for a "type-in" effect on an HTML element.
	 * Uses GSAP's SplitText library.
	 *
	 * @param {HTMLElement} element - The element to play this animation on.
	 * @param {Object} options - Optional options.
	 * @param {'chars'|'chars,words'|'chars,words,lines'} options.splitType - Controls whether to split the
	 * text into chars, chars and words, or chars, words, and lines.
	 * @param {Number} options.typeInterval - The amount of time, in seconds,
	 * between each individual character being shown.
	 * @returns {TimelineLite} - A GSAP TimelineLite instance.
	 */
	function typeAnim(element, {splitType = 'chars,words', typeInterval = 0.03} = {}) {
		const tl = new TimelineLite();

		const split = new SplitText(element, {
			type: splitType,
			charsClass: 'character',
			linesClass: 'line'
		});

		memoryMap.set(element, {split});

		switch (splitType) {
			case 'chars':
				tl.staggerFromTo(split.chars, 0.001, {
					visibility: 'hidden'
				}, {
					visibility: 'visible'
				}, typeInterval);

				break;
			case 'chars,words':
			case 'chars,words,lines':
				split.words.forEach(word => {
					tl.staggerFromTo(word.children, 0.001, {
						visibility: 'hidden'
					}, {
						visibility: 'visible'
					}, typeInterval);

					tl.to(EMPTY_OBJ, typeInterval, EMPTY_OBJ);
				});
				break;
			default:
				throw new Error(`Unexpected splitType "${splitType}"`);
		}

		return tl;
	}

	/**
	 * Creates an animation for a "type-out" or "un-type" effect on an HTML element.
	 * The element must have previously used the "typeAnim" method to define its "split" property.
	 * Uses GSAP's SplitText library.
	 *
	 * @param {HTMLElement} element - The element to play this animation on.
	 * @param {Number} typeInterval - The amount of time, in seconds, between each individual character being shown.
	 * @returns {TimelineLite} - A GSAP TimelineLite instance.
	 */
	function untypeAnim(element, typeInterval = 0.03) {
		const tl = new TimelineLite();
		if (!memoryMap.has(element)) {
			return tl;
		}

		const split = memoryMap.get(element).split;

		if (split.words) {
			split.words.forEach(word => {
				tl.staggerTo(word.children, 0.001, {
					visibility: 'hidden'
				}, typeInterval);

				tl.to(EMPTY_OBJ, typeInterval, EMPTY_OBJ);
			});
		} else {
			tl.staggerFrom(split.chars, 0.001, {
				visibility: 'hidden'
			}, typeInterval);
		}

		return tl;
	}

	window.TypeAnims = {
		type: typeAnim,
		untype: untypeAnim
	};
})();
