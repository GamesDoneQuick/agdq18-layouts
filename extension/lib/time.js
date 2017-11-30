'use strict';

// Packages
const parseMsToObj = require('parse-ms');
const convertUnitToMs = require('milliseconds');

/**
 * An object representing the individual dimensions of an amount of time.
 * @typedef {{days: Number, hours: Number, minutes: Number, seconds: Number, milliseconds: Number}} ParsedTime
 */

/**
 * An object representing the individual dimensions of an amount of time,
 * plus some alternate representations of that time and a timestamp of when this struct was created.
 * @typedef {{...ParsedTime, formatted: String, raw: Number, timestamp: Number}} TimeStruct
 */

const TimeUtils = {
	/**
	 * Constructs a new TimeStruct with the provided number of milliseconds.
	 * @param {Number} [milliseconds = 0] - The value to instantiate this TimeObject with, in milliseconds.
	 * @returns {TimeStruct} - A populated TimeStruct object.
	 */
	createTimeStruct(milliseconds = 0) {
		const parsedTime = TimeUtils.parseMilliseconds(milliseconds);
		// Can't use object spread because of https://github.com/Polymer/polymer-cli/issues/888
		return Object.assign({}, parsedTime, {
			formatted: TimeUtils.formatMilliseconds(milliseconds),
			raw: milliseconds,
			timestamp: Date.now()
		});
	},

	/**
	 * Formats a number of milliseconds into a string ([hh:]mm:ss).
	 * @param {number} inputMs - The number of milliseconds to format.
	 * @returns {string} - The formatted time sting.
	 */
	formatMilliseconds(inputMs) {
		const {days, hours, minutes, seconds, milliseconds} = TimeUtils.parseMilliseconds(inputMs);
		let str = '';

		if (days) {
			str += `${days}d `;
		}

		if (hours) {
			str += `${hours}:`;
		}

		const paddedMinutes = String(minutes).padStart(2, '0');
		const paddedSeconds = String(seconds).padStart(2, '0');
		const tenths = String(milliseconds).charAt(0);

		str += `${paddedMinutes}:${paddedSeconds}.${tenths}`;
		return str;
	},

	/**
	 * Parses a number of milliseconds into a ParsedTime object.
	 * @param {number} milliseconds - A number of milliseconds.
	 * @returns {ParsedTime} - An object representing each dimension of the time.
	 */
	parseMilliseconds(milliseconds) {
		return parseMsToObj(milliseconds);
	},

	/**
	 * Parses a number of seconds into a ParsedTime object.
	 * @param {number} seconds - A number of seconds.
	 * @returns {ParsedTime} - An object representing each dimension of the time.
	 */
	parseSeconds(seconds) {
		return TimeUtils.parseMilliseconds(seconds * 1000);
	},

	/**
	 * Parses a formatted time string into an integer of milliseconds.
	 * @param {string} timeString - The formatted time string to parse.
	 * Accepts the following: hh:mm:ss.sss, hh:mm:ss, hh:mm, hh
	 * @returns {number} - The parsed time string represented as milliseconds.
	 */
	parseTimeString(timeString) {
		let ms = 0;
		const timeParts = timeString.split(':').filter(part => part.trim());
		if (timeParts.length === 3) {
			ms += convertUnitToMs.hours(parseInt(timeParts[0], 10));
			ms += convertUnitToMs.minutes(parseInt(timeParts[1], 10));
			ms += convertUnitToMs.seconds(parseFloat(timeParts[2]));
			return ms;
		}

		if (timeParts.length === 2) {
			ms += convertUnitToMs.minutes(parseInt(timeParts[0], 10));
			ms += convertUnitToMs.seconds(parseFloat(timeParts[1]));
			return ms;
		}

		if (timeParts.length === 1) {
			ms += convertUnitToMs.seconds(parseFloat(timeParts[0]));
			return ms;
		}

		throw new Error(`Unexpected format of timeString argument: ${timeString}`);
	}
};

module.exports = TimeUtils;
