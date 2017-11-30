'use strict';

// Packages
const NanoTimer = require('nanotimer');

// Ours
const nodecg = require('./util/nodecg-api-context').get();
const TimeUtils = require('./lib/time');

const time = nodecg.Replicant('countdown', {defaultValue: TimeUtils.createTimeStruct(600 * 1000), persistent: false});
const running = nodecg.Replicant('countdownRunning', {defaultValue: false, persistent: false});
const countdownTimer = new NanoTimer();

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

	const timeStruct = TimeUtils.createTimeStruct(TimeUtils.parseTimeString(startTime));
	if (timeStruct.raw <= 0) {
		return;
	}

	running.value = true;
	time.value = timeStruct;
	countdownTimer.clearInterval();
	countdownTimer.setInterval(tick, '', '1s');
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
	countdownTimer.clearInterval();
}

/**
 * Ticks the countdown timer down by one second, stopping the timer if it hits zero.
 * @returns {undefined}
 */
function tick() {
	time.value = TimeUtils.createTimeStruct(time.value.raw - 1000);
	if (time.value.raw <= 0) {
		stop();
	}
}
