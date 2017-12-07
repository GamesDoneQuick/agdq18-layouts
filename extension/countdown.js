'use strict';

// Ours
const nodecg = require('./util/nodecg-api-context').get();
const TimeUtils = require('./lib/time');

const time = nodecg.Replicant('countdown', {defaultValue: TimeUtils.createTimeStruct(600 * 1000), persistent: false});
const running = nodecg.Replicant('countdownRunning', {defaultValue: false, persistent: false});
let countdownTimer;

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

	const durationMs = TimeUtils.parseTimeString(startTime);
	if (durationMs <= 0) {
		return;
	}

	running.value = true;
	time.value = TimeUtils.createTimeStruct(durationMs);

	if (countdownTimer) {
		countdownTimer.stop();
		countdownTimer.removeAllListeners();
	}

	countdownTimer = new TimeUtils.CountdownTimer(Date.now() + durationMs);
	countdownTimer.on('tick', remainingTimeStruct => {
		time.value = remainingTimeStruct;
	});
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
	if (countdownTimer) {
		countdownTimer.stop();
	}
}
