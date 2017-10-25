'use strict';

let timer = null;

// Ours
const nodecg = require('./util/nodecg-api-context').get();
const TimeObject = require('../shared/classes/time-object');

const time = nodecg.Replicant('countdown', {defaultValue: new TimeObject(600), persistent: false});
const running = nodecg.Replicant('countdownRunning', {defaultValue: false, persistent: false});

nodecg.listenFor('startCountdown', start);
nodecg.listenFor('stopCountdown', stop);

/**
 * Starts the countdown at the specified startTime.
 * @param {string} startTime - A formatted time string, such as 1:00 for one hour.
 * @returns {undefined}
 */
function start(startTime) {
	if (running.value) {
		return;
	}

	const timeObj = new TimeObject(TimeObject.parseSeconds(startTime));
	if (timeObj.raw <= 0) {
		return;
	}

	running.value = true;
	time.value = timeObj;
	timer = setInterval(tick, 1000);
}

/**
 * Stops the countdown.
 * @returns {undefined}
 */
function stop() {
	if (!running.value) {
		return;
	}

	running.value = false;
	clearInterval(timer);
}

/**
 * Ticks the countdown timer down by one second, stopping the timer if it hits zero.
 * @returns {undefined}
 */
function tick() {
	TimeObject.decrement(time.value);

	if (time.value.raw <= 0) {
		stop();
	}
}
