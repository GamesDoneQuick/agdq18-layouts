'use strict';

// Packages
const firebase = require('firebase-admin');

// Ours
const nodecg = require('./util/nodecg-api-context').get();
const TimeUtils = require('./lib/time');

firebase.initializeApp({
	credential: firebase.credential.cert(nodecg.bundleConfig.firebase),
	databaseURL: `https://${nodecg.bundleConfig.firebase.project_id}.firebaseio.com`
});

const database = firebase.database();
const lowerthirdPulseTimeRemaining = nodecg.Replicant('interview:lowerthirdTimeRemaining', {defaultValue: 0, persistent: false});
const lowerthirdShowing = nodecg.Replicant('interview:lowerthirdShowing', {defaultValue: false, persistent: false});
const throwIncoming = nodecg.Replicant('interview:throwIncoming');
const questionPulseTimeRemaining = nodecg.Replicant('interview:questionTimeRemaining', {defaultValue: 0, persistent: false});
const questionShowing = nodecg.Replicant('interview:questionShowing', {defaultValue: false, persistent: false});
const questionSortMap = nodecg.Replicant('interview:questionSortMap');
const questionTweetsRep = nodecg.Replicant('interview:questionTweets');
const interviewStopwatch = nodecg.Replicant('interview:stopwatch');
const currentLayout = nodecg.Replicant('gdq:currentLayout');
const prizePlaylist = nodecg.Replicant('interview:prizePlaylist');
const showPrizesOnMonitor = nodecg.Replicant('interview:showPrizesOnMonitor');
const allPrizes = nodecg.Replicant('allPrizes');
const pulseIntervalMap = new Map();
const pulseTimeoutMap = new Map();
let interviewTimer;
let _repliesListener;
let _repliesRef;

// Restore lost time, if applicable.
if (interviewStopwatch.value.running) {
	const missedTime = Date.now() - interviewStopwatch.value.time.timestamp;
	const previousTime = interviewStopwatch.value.time.raw;
	const offset = previousTime + missedTime;
	interviewStopwatch.value.running = false;
	startInterviewTimer(offset);
}

nodecg.Replicant('interview:names', {defaultValue: []});

lowerthirdShowing.on('change', newVal => {
	if (!newVal) {
		clearTimerFromMap(lowerthirdShowing, pulseIntervalMap);
		clearTimerFromMap(lowerthirdShowing, pulseTimeoutMap);
		lowerthirdPulseTimeRemaining.value = 0;
	}
});

currentLayout.on('change', newVal => {
	if (newVal === 'interview') {
		throwIncoming.value = false;
		startInterviewTimer();
	} else {
		stopInterviewTimer();
	}
});

nodecg.listenFor('pulseInterviewLowerthird', duration => {
	pulse(lowerthirdShowing, lowerthirdPulseTimeRemaining, duration);
});

nodecg.listenFor('pulseInterviewQuestion', (id, cb) => {
	pulse(questionShowing, questionPulseTimeRemaining, 10).then(() => {
		markQuestionAsDone(id, cb);
	}).catch(error => {
		cb(error);
	});
});

questionShowing.on('change', newVal => {
	// Hide the interview lowerthird when a question starts showing.
	if (newVal) {
		lowerthirdShowing.value = false;
	} else {
		clearTimerFromMap(questionShowing, pulseIntervalMap);
		clearTimerFromMap(questionShowing, pulseTimeoutMap);
		questionPulseTimeRemaining.value = 0;
	}
});

questionSortMap.on('change', (newVal, oldVal) => {
	if (!oldVal || newVal[0] !== oldVal[0]) {
		questionShowing.value = false;
	}
});

database.ref('/active_tweet_id').on('value', snapshot => {
	if (_repliesRef && _repliesListener) {
		_repliesRef.off('value', _repliesListener);
	}

	const activeTweetID = snapshot.val();
	_repliesRef = database.ref(`/tweets/${activeTweetID}/replies`);
	_repliesListener = _repliesRef.on('value', snapshot => {
		const rawReplies = snapshot.val();
		const convertedAndFilteredReplies = [];
		for (const item in rawReplies) {
			if (!{}.hasOwnProperty.call(rawReplies, item)) {
				continue;
			}

			const reply = rawReplies[item];

			// Exclude tweets that somehow have no approval status yet.
			if (!reply.approval_status) {
				continue;
			}

			// Exclude any tweet that hasn't been approved by tier1.
			if (reply.approval_status.tier1 !== 'approved') {
				continue;
			}

			// Exclude tweets that have already been marked as "done" by tier2 (this app).
			if (reply.approval_status.tier2 === 'done') {
				continue;
			}

			convertedAndFilteredReplies.push(reply);
		}

		questionTweetsRep.value = convertedAndFilteredReplies;
		updateQuestionSortMap();
	});
});

// Ensure that the prize playlist only contains prizes currently in the tracker.
allPrizes.on('change', newVal => {
	prizePlaylist.value = prizePlaylist.value.filter(playlistEntry => {
		return newVal.find(prize => {
			return prize.id === playlistEntry.id;
		});
	});
});

nodecg.listenFor('interview:updateQuestionSortMap', updateQuestionSortMap);

nodecg.listenFor('interview:markQuestionAsDone', markQuestionAsDone);

nodecg.listenFor('interview:end', () => {
	database.ref('/active_tweet_id').set(0);
});

nodecg.listenFor('interview:addPrizeToPlaylist', prizeId => {
	if (typeof prizeId !== 'number' || prizeId < 0) {
		return;
	}

	const existingIndex = prizePlaylist.value.findIndex(({id}) => id === prizeId);
	if (existingIndex >= 0) {
		return;
	}

	prizePlaylist.value.push({
		id: prizeId,
		complete: false
	});
});

nodecg.listenFor('interview:removePrizeFromPlaylist', prizeId => {
	if (typeof prizeId !== 'number' || prizeId < 0) {
		return;
	}

	const existingIndex = prizePlaylist.value.findIndex(({id}) => id === prizeId);
	if (existingIndex < 0) {
		return;
	}

	prizePlaylist.value.splice(existingIndex, 1);
});

nodecg.listenFor('interview:markPrizeAsDone', prizeId => {
	if (typeof prizeId !== 'number' || prizeId < 0) {
		return;
	}

	const entry = prizePlaylist.value.find(({id}) => id === prizeId);
	if (entry) {
		entry.complete = true;
	}
});

nodecg.listenFor('interview:markPrizeAsNotDone', prizeId => {
	if (typeof prizeId !== 'number' || prizeId < 0) {
		return;
	}

	const entry = prizePlaylist.value.find(({id}) => id === prizeId);
	if (entry) {
		entry.complete = false;
	}
});

nodecg.listenFor('interview:clearPrizePlaylist', () => {
	prizePlaylist.value = [];
});

nodecg.listenFor('interview:showPrizePlaylistOnMonitor', () => {
	showPrizesOnMonitor.value = true;
});

nodecg.listenFor('interview:hidePrizePlaylistOnMonitor', () => {
	showPrizesOnMonitor.value = false;
});

function markQuestionAsDone(id, cb = function () {}) {
	if (!_repliesRef) {
		return cb(new Error('_repliesRef not ready!'));
	}

	if (!id) {
		return cb();
	}

	_repliesRef.child(id).transaction(tweet => {
		if (tweet) {
			if (!tweet.approval_status) {
				tweet.approval_status = {}; // eslint-disable-line camelcase
			}

			tweet.approval_status.tier2 = 'done';
		}

		return tweet;
	}).then(() => {
		updateQuestionSortMap();
		cb();
	}).catch(error => {
		nodecg.log.error('[interview]', error);
		cb(error);
	});
}

/**
 * Fixes up the sort map by adding and new IDs and removing deleted IDs.
 * @returns {undefined}
 */
function updateQuestionSortMap() {
	// To the sort map, add the IDs of any new question tweets.
	questionTweetsRep.value.forEach(tweet => {
		if (questionSortMap.value.indexOf(tweet.id_str) < 0) {
			questionSortMap.value.push(tweet.id_str);
		}
	});

	// From the sort map, remove the IDs of any question tweets that were deleted or have been filtered out.
	for (let i = questionSortMap.value.length - 1; i >= 0; i--) {
		const result = questionTweetsRep.value.findIndex(tweet => tweet.id_str === questionSortMap.value[i]);
		if (result < 0) {
			questionSortMap.value.splice(i, 1);
		}
	}
}

/**
 * Pulses a replicant for a specified duration, and tracks the remaining time in another replicant.
 * @param {Replicant} showingRep - The Boolean replicant that controls if the element is showing or not.
 * @param {Replicant} pulseTimeRemainingRep - The Number replicant that tracks the remaining time in this pulse.
 * @param {Number} duration - The desired duration of the pulse in seconds.
 * @returns {Promise<undefined>} - A promise which resolves when the pulse has completed.
 */
function pulse(showingRep, pulseTimeRemainingRep, duration) {
	return new Promise(resolve => {
		// Don't stack pulses
		if (showingRep.value) {
			return resolve();
		}

		showingRep.value = true;
		pulseTimeRemainingRep.value = duration;
		clearTimerFromMap(showingRep, pulseIntervalMap);
		clearTimerFromMap(showingRep, pulseTimeoutMap);

		// Count down lowerthirdPulseTimeRemaining
		pulseIntervalMap.set(showingRep, setInterval(() => {
			if (pulseTimeRemainingRep.value > 0) {
				pulseTimeRemainingRep.value--;
			} else {
				clearTimerFromMap(showingRep, pulseIntervalMap);
				pulseTimeRemainingRep.value = 0;
			}
		}, 1000));

		// End pulse after "duration" seconds
		pulseTimeoutMap.set(showingRep, setTimeout(() => {
			clearTimerFromMap(showingRep, pulseIntervalMap);
			pulseTimeRemainingRep.value = 0;
			showingRep.value = false;
			resolve();
		}, duration * 1000));
	});
}

function clearTimerFromMap(key, map) {
	clearInterval(map.get(key));
	clearTimeout(map.get(key));
	map.delete(key);
}

function startInterviewTimer(offset) {
	if (interviewStopwatch.value.running) {
		return;
	}

	interviewStopwatch.value.running = true;
	interviewStopwatch.value.time = TimeUtils.createTimeStruct();
	if (interviewTimer) {
		interviewTimer.stop();
		interviewTimer.removeAllListeners();
	}

	interviewTimer = new TimeUtils.CountupTimer({offset});
	interviewTimer.on('tick', elapsedTimeStruct => {
		interviewStopwatch.value.time = elapsedTimeStruct;
	});
}

function stopInterviewTimer() {
	if (!interviewStopwatch.value.running) {
		return;
	}

	interviewStopwatch.value.running = false;
	if (interviewTimer) {
		interviewTimer.stop();
	}
}

/* Disabled for now. Can't get drag sort and button sort to work simultaneously.
nodecg.listenFor('promoteQuestion', questionID => {
	const sortIndex = questionSortMap.value.indexOf(questionID);
	if (sortIndex <= 0) {
		throw new Error(`Tried to promote tweet with ID "${questionID}", but its sortIndex was "${sortIndex}"`);
	}
	questionSortMap.value.splice(sortIndex - 1, 0, questionSortMap.value.splice(sortIndex, 1)[0]);
});

nodecg.listenFor('demoteQuestion', questionID => {
	const sortIndex = questionSortMap.value.indexOf(questionID);
	if (sortIndex >= questionSortMap.value.length - 1) {
		throw new Error(`Tried to promote tweet with ID "${questionID}", but its sortIndex was "${sortIndex}"`);
	}
	questionSortMap.value.splice(sortIndex + 1, 0, questionSortMap.value.splice(sortIndex, 1)[0]);
});
*/
