/**
 * TimeObject class.
 * @property {Number} raw
 * @property {Number} hours
 * @property {Number} minutes
 * @property {Number} seconds
 * @property {String} formatted
 * @property {Number} timestamp
 */
class TimeObject {
	/**
	 * Constructs a new TimeObject with the provided number of seconds.
	 * @param {Number} [seconds = 0] - The value to instantiate this TimeObject with, in seconds.
	 */
	constructor(seconds = 0) {
		TimeObject.setSeconds(this, seconds);
	}

	/**
	 * Increments a TimeObject by one second.
	 * @param {TimeObject} t - The TimeObject to increment.
	 * @returns {TimeObject} - The TimeObject passed in as an argument.
	 */
	static increment(t) {
		t.raw++;

		const hms = TimeObject.secondsToHMS(t.raw);
		t.hours = hms.h;
		t.minutes = hms.m;
		t.seconds = hms.s;
		t.formatted = TimeObject.formatHMS(hms);
		t.timestamp = Date.now();
		return t;
	}

	/**
	 * Decrements a TimeObject by one second.
	 * @param {TimeObject} t - The TimeObject to increment.
	 * @returns {TimeObject} - The TimeObject passed in as an argument.
	 */
	static decrement(t) {
		t.raw--;

		const hms = TimeObject.secondsToHMS(t.raw);
		t.hours = hms.h;
		t.minutes = hms.m;
		t.seconds = hms.s;
		t.formatted = TimeObject.formatHMS(hms);
		t.timestamp = Date.now();
		return t;
	}

	/**
	 * Sets the value of a TimeObject.
	 * @param {TimeObject} t - The TimeObject to set.
	 * @param {Number} seconds - The value to set to (in seconds).
	 * @returns {TimeObject} - The TimeObject passed in as an argument.
	 */
	static setSeconds(t, seconds) {
		const hms = TimeObject.secondsToHMS(seconds);
		t.hours = hms.h;
		t.minutes = hms.m;
		t.seconds = hms.s;
		t.formatted = TimeObject.formatHMS(hms);
		t.raw = seconds;
		t.timestamp = Date.now();
		return t;
	}

	/**
	 * Formats an HMS object into a string ([hh:]mm:ss).
	 * @param {{h: number, m: number, s: number}} hms - The HMS object to format.
	 * @returns {string} - The formatted time string.
	 */
	static formatHMS(hms) {
		let str = '';
		if (hms.h) {
			str += `${hms.h}:`;
		}

		str += `${(hms.m < 10 ? `0${hms.m}` : hms.m)}:${(hms.s < 10 ? `0${hms.s}` : hms.s)}`;
		return str;
	}

	/**
	 * Formats a number of seconds into a string ([hh:]mm:ss).
	 * @param {number} seconds - The number of seconds to format.
	 * @returns {string} - The formatted time sting.
	 */
	static formatSeconds(seconds) {
		const hms = TimeObject.secondsToHMS(seconds);
		return TimeObject.formatHMS(hms);
	}

	/**
	 * Parses a number of seconds into an HMS object.
	 * @param {number} seconds - A number of seconds.
	 * @returns {{h: number, m: number, s: number}} - An HMS object.
	 */
	static secondsToHMS(seconds) {
		return {
			h: Math.floor(seconds / 3600),
			m: Math.floor(seconds % 3600 / 60),
			s: Math.floor(seconds % 3600 % 60)
		};
	}

	/**
	 * Parses a formatted time string into an integer of seconds.
	 * @param {string} timeString - The formatted time string to parse (hh:mm:ss or mm:ss).
	 * @returns {number} - The parsed time string represented as seconds.
	 */
	static parseSeconds(timeString) {
		const timeParts = timeString.split(':');
		if (timeParts.length === 3) {
			return parseInt(timeParts[0] * 3600, 10) + parseInt(timeParts[1] * 60, 10) + parseInt(timeParts[2], 10);
		}

		if (timeParts.length === 2) {
			return parseInt(timeParts[0] * 60, 10) + parseInt(timeParts[1], 10);
		}

		if (timeParts.length === 1) {
			return parseInt(timeParts[0], 10);
		}

		throw new Error(`Unexpected format of timeString argument: ${timeString}`);
	}
}

if (typeof module === 'object' && typeof module.exports === 'object') {
	module.exports = TimeObject;
}
