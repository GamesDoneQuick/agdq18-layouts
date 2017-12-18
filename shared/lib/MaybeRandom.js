/* eslint-env browser */
/* global Random, TweenLite, Linear */
(function () {
	'use strict';

	/**
	 * The sole argument object to the getMaybeRandomNumber function.
	 * @typedef {Object} MaybeRandomNumberParams
	 * @property {Number} probability - The percent chance for choosing a random value.
	 * A value of 1 will always create a random value, a value of 0.5 will
	 * create a random value 50% of the time, value of 0.25 will be 25%, etc.
	 * @property {Number} normalValue - The value returned when a random value is NOT chosen.
	 * @property {Number} [minValue = 0] - The minimum random value that can be generated.
	 * @property {Number} [maxValue = 1] - The maximum random value that can be generated.
	 */

	/**
	 * Returns a number that has a chance of being random.
	 *
	 * @param {MaybeRandomNumberParams} args - The args.
	 * @returns {Number} - The final calculated number.
	 *
	 * @example <caption>Example usage with default minValue and maxValue.</caption>
	 * getMaybeRandomValue({
	 * 	probability: 0.5,
	 *	normalValue: 1
	 * });
	 *
	 * @example <caption>Example usage with specified minValue and maxValue.</caption>
	 * getMaybeRandomValue({
	 * 	probability: 0.25,
	 *	normalValue: 10,
	 *	minValue: 2,
	 *	maxValue: 20
	 * });
	 */
	function getMaybeRandomNumber(args = {}) {
		// Hacks to get around WebStorm's JSDoc inspection limitations.
		// Normally we'd just use object destructuring in the function signature with
		// default values and call it a day, but WebStorm doesn't seem to
		// inspect those properly, and as a result they aren't fully available in autocomplete, etc.
		if (!{}.hasOwnProperty.call(args, 'minValue')) {
			args.minValue = 0;
		}
		if (!{}.hasOwnProperty.call(args, 'maxValue')) {
			args.maxValue = 1;
		}

		if (args.probability > 0) {
			const randomNumber = Random.real(0, 1, true)(Random.engines.browserCrypto);
			if (randomNumber <= args.probability) {
				return Random.real(args.minValue, args.maxValue, true)(Random.engines.browserCrypto);
			}
		}

		return args.normalValue;
	}

	/**
	 * Creates a tween which uses getMaybeRandomNumber.
	 *
	 * @param {Object|Array} target - The object to tween, or an array of objects.
	 * @param {String} propName - The name of the property to tween on the target object.
	 * @param {Number} duration - The duration of the tween.
	 * @param {Function} [ease=Linear.easeNone] - An easing function which accepts a single "progress" argument,
	 * which is a float in the range 0 - 1. All GSAP eases are supported, as they follow this signature.
	 * @param {Number} [delay=0] - How long, in seconds, to delay the start of the tween.
	 * @param {MaybeRandomNumberParams} start - The starting getMaybeRandomNumber arguments.
	 * @param {MaybeRandomNumberParams} end - The ending getMaybeRandomNumber arguments.
	 * @param {Function} [onUpdate] - An optional callback which will be invoked on every tick with the new MaybeRandom value.
	 * @returns {TweenLite} - A GSAP TweenLite tween.
	 *
	 * @example
	 * createMaybeRandomTween({
	 *	target: element.style,
	 *	propName: 'opacity',
	 *	duration: 1,
	 *	ease: Sine.easeOut,
	 *	start: {probability: 1, normalValue: 0},
	 *	end: {probability: 0, normalValue: 1}
	 * });
	 */
	function createMaybeRandomTween({
		target, propName, duration, ease = Linear.easeNone, delay = 0, start, end, onUpdate
	}) {
		// Can't use spread operator in this method because of https://github.com/Polymer/polymer-cli/issues/888
		const proxy = Object.assign({}, start);
		const tweenProps = Object.assign({
			ease,
			delay
		}, end);

		if (Array.isArray(target)) {
			tweenProps.onUpdate = () => {
				const randomValue = getMaybeRandomNumber(proxy);
				target.forEach(childTarget => {
					childTarget[propName] = randomValue;
				});

				if (onUpdate) {
					onUpdate(randomValue);
				}
			};
		} else {
			tweenProps.onUpdate = () => {
				const randomValue = getMaybeRandomNumber(proxy);
				target[propName] = randomValue;
				if (onUpdate) {
					onUpdate(randomValue);
				}
			};
		}

		return TweenLite.to(proxy, duration, tweenProps);
	}

	window.MaybeRandom = {
		getNumber: getMaybeRandomNumber,
		createTween: createMaybeRandomTween
	};
})();
