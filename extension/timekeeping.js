'use strict';

// Packages
const NanoTimer = require('nanotimer');

// Ours
const nodecg = require('./util/nodecg-api-context').get();
const TimeObject = require('../shared/classes/time-object');

const timer = new NanoTimer();
const checklistComplete = nodecg.Replicant('checklistComplete');
const currentRun = nodecg.Replicant('currentRun');
const stopwatch = nodecg.Replicant('stopwatch', {
	defaultValue: (function () {
		const to = new TimeObject(0);
		to.state = 'stopped';
		to.results = [null, null, null, null];
		return to;
	})()
});

// Load the existing time and start the stopwatch at that.
if (stopwatch.value.state === 'running') {
	const missedSeconds = Math.round((Date.now() - stopwatch.value.timestamp) / 1000);
	TimeObject.setSeconds(stopwatch.value, stopwatch.value.raw + missedSeconds);
	start(true);
}

nodecg.listenFor('startTimer', start);
nodecg.listenFor('stopTimer', stop);
nodecg.listenFor('resetTimer', reset);
nodecg.listenFor('completeRunner', data => {
	if (currentRun.value.coop) {
		// Finish all runners.
		currentRun.value.runners.forEach((runner, index) => {
			if (!runner) {
				return;
			}

			completeRunner({index, forfeit: data.forfeit});
		});
	} else {
		completeRunner(data);
	}
});
nodecg.listenFor('resumeRunner', index => {
	if (currentRun.value.coop) {
		// Resume all runners.
		currentRun.value.runners.forEach((runner, index) => {
			if (!runner) {
				return;
			}

			resumeRunner(index);
		});
	} else {
		resumeRunner(index);
	}
});
nodecg.listenFor('editTime', editTime);

if (nodecg.bundleConfig.footpedal.enabled) {
	const gamepad = require('gamepad');
	gamepad.init();

	// Poll for events
	setInterval(gamepad.processEvents, 16);
	// Scan for new gamepads as a slower rate
	// TODO: this breaks USB audio devices lmao
	setInterval(gamepad.detectDevices, 1000);

	// Listen for buttonId down event from our target gamepad.
	gamepad.on('down', (id, num) => {
		if (num !== nodecg.bundleConfig.footpedal.buttonId) {
			return;
		}

		if (stopwatch.value.state === 'running') {
			// If this is a race, don't let the pedal finish the timer.
			if (currentRun.value.runners.length > 1 && !currentRun.value.coop) {
				nodecg.log.warn('Footpedal was hit to finish the timer, but this is a race so no action will be taken.');
				return;
			}

			nodecg.log.info('Footpedal hit, finishing timer.');

			// Finish all runners.
			currentRun.value.runners.forEach((runner, index) => {
				if (!runner) {
					return;
				}

				completeRunner({index, forfeit: false});
			});
		} else {
			if (!checklistComplete.value) {
				nodecg.log.warn('Footpedal was hit to start the timer, but the checklist is not complete so no action will be taken.');
				return;
			}

			nodecg.log.info('Footpedal hit, starting timer.');
			start();

			// Resume all runners.
			currentRun.value.runners.forEach((runner, index) => {
				if (!runner) {
					return;
				}

				resumeRunner(index);
			});
		}
	});
}

/**
 * Starts the timer.
 * @param {Boolean} [force=false] - Forces the timer to start again, even if already running.
 * @returns {undefined}
 */
function start(force) {
	if (!force && stopwatch.value.state === 'running') {
		return;
	}

	timer.clearInterval();
	stopwatch.value.state = 'running';
	timer.setInterval(tick, '', '1s');
}

/**
 * Increments the timer by one second.
 * @returns {undefined}
 */
function tick() {
	TimeObject.increment(stopwatch.value);
}

/**
 * Stops the timer.
 * @returns {undefined}
 */
function stop() {
	timer.clearInterval();
	stopwatch.value.state = 'stopped';
}

/**
 * Stops and resets the timer, clearing the time and results.
 * @returns {undefined}
 */
function reset() {
	stop();
	TimeObject.setSeconds(stopwatch.value, 0);
	stopwatch.value.results = [];
}

/**
 * Marks a runner as complete.
 * @param {Number} index - The runner to modify (0-3).
 * @param {Boolean} forfeit - Whether or not the runner forfeit.
 * @returns {undefined}
 */
function completeRunner({index, forfeit}) {
	if (!stopwatch.value.results[index]) {
		stopwatch.value.results[index] = new TimeObject(stopwatch.value.raw);
	}

	stopwatch.value.results[index].forfeit = forfeit;
	recalcPlaces();
}

/**
 * Marks a runner as still running.
 * @param {Number} index - The runner to modify (0-3).
 * @returns {undefined}
 */
function resumeRunner(index) {
	stopwatch.value.results[index] = null;
	recalcPlaces();

	if (stopwatch.value.state === 'finished') {
		const missedSeconds = Math.round((Date.now() - stopwatch.value.timestamp) / 1000);
		TimeObject.setSeconds(stopwatch.value, stopwatch.value.raw + missedSeconds);
		start();
	}
}

/**
 * Edits the final time of a result.
 * @param {Number} index - The result index to edit.
 * @param {String} newTime - A hh:mm:ss (or mm:ss) formatted new time.
 * @returns {undefined}
 */
function editTime({index, newTime}) {
	if (!newTime) {
		return;
	}

	const newSeconds = TimeObject.parseSeconds(newTime);
	if (isNaN(newSeconds)) {
		return;
	}

	if (index === 'master') {
		TimeObject.setSeconds(stopwatch.value, newSeconds);
	} else if (stopwatch.value.results[index]) {
		TimeObject.setSeconds(stopwatch.value.results[index], newSeconds);
		recalcPlaces();

		if (currentRun.value.runners.length === 1) {
			TimeObject.setSeconds(stopwatch.value, newSeconds);
		}
	}
}

/**
 * Re-calculates the podium place for all runners.
 * @returns {undefined}
 */
function recalcPlaces() {
	const finishedResults = stopwatch.value.results.filter(r => {
		if (r) {
			r.place = 0;
			return !r.forfeit;
		}

		return false;
	});

	finishedResults.sort((a, b) => {
		return a.raw - b.raw;
	});

	finishedResults.forEach((r, index) => {
		r.place = index + 1;
	});

	// If every runner is finished, stop ticking and set timer state to "finished".
	let allRunnersFinished = true;
	currentRun.value.runners.forEach((runner, index) => {
		if (!runner) {
			return;
		}

		if (!stopwatch.value.results[index]) {
			allRunnersFinished = false;
		}
	});

	if (allRunnersFinished) {
		stop();
		stopwatch.value.state = 'finished';
	}
}
