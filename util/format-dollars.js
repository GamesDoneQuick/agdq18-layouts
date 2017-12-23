'use strict';

/**
 * Formats an amount as USD, cents optional.
 * @param {Number} amount - The amount to format.
 * @param {Boolean} cents - Whether or not to include cents in the formatted string.
 * @returns {string} - The formatted string.
 */
module.exports = function formatDollars(amount, {cents = true} = {}) {
	const fractionDigits = cents ? 2 : 0;
	return parseFloat(amount).toLocaleString('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: fractionDigits,
		minimumFractionDigits: fractionDigits
	});
};
