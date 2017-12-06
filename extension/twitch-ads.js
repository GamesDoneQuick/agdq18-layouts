'use strict';

// Packages
const NanoTimer = require('nanotimer');
const request = require('request-promise');

// Ours
const nodecg = require('./util/nodecg-api-context').get();
const TimeUtils = require('./lib/time');
const {STOPWATCH_STATES} = require('./timekeeping');

const log = new nodecg.Logger(`${nodecg.bundleName}:twitch`);
const timeSince = nodecg.Replicant('twitch:timeSinceLastAd', {defaultValue: TimeUtils.createTimeStruct()});
const timeLeft = nodecg.Replicant('twitch:timeLeftInAd', {defaultValue: TimeUtils.createTimeStruct()});
const canPlayTwitchAd = nodecg.Replicant('twitch:canPlayAd');
const stopwatch = nodecg.Replicant('stopwatch');
const timeSinceTimer = new NanoTimer();
const timeLeftTimer = new NanoTimer();
const CANT_PLAY_REASONS = {
	AD_IN_PROGRESS: 'ad in progress',
	RUN_IN_PROGRESS: 'run in progress',
	ON_COOLDOWN: 'on cooldown',
	NONE: ''
};

// Load the existing timeSince and timeLeft and resume at the appropriate time.
if (timeSince.value.raw > 0) {
	const missedMilliseconds = Date.now() - timeSince.value.timestamp;
	resetTimeSinceTicker(timeSince.value.raw + missedMilliseconds);
}

if (timeLeft.value.raw > 0) {
	const missedMilliseconds = Date.now() - timeLeft.value.timestamp;
	resetTimeLeftTicker(timeLeft.value.raw - missedMilliseconds);
}

[timeLeft, timeSince, stopwatch].forEach(replicant => {
	replicant.on('change', updateCanPlay);
});

nodecg.listenFor('twitch:playAd', durationSeconds => {
	if (!canPlayTwitchAd.value.canPlay) {
		log.error('Requested Twitch ad when it was not allowed (%s)', canPlayTwitchAd.value.reason);
		return;
	}

	log.info('Requesting %d second Twitch ad...', durationSeconds);
	request({
		method: 'post',
		uri: `https://api.twitch.tv/kraken/channels/${nodecg.bundleConfig.twitch.channelId}/commercial`,
		headers: {
			Accept: 'application/vnd.twitchtv.v5+json',
			Authorization: `OAuth ${nodecg.bundleConfig.twitch.oauthToken}`,
			'Client-ID': nodecg.bundleConfig.twitch.clientId,
			'Content-Type': 'application/json'
		},
		body: {durationSeconds},
		json: true
	}).then(res => {
		resetTimeSinceTicker();
		resetTimeLeftTicker((durationSeconds + 15) * 1000);
		if (res.Length === durationSeconds) {
			log.info('Successfully started %d second Twitch Ad.', res.Length);
		} else {
			log.info('Successfully started %d second Twitch Ad, but we requested %d seconds.', res.Length, durationSeconds);
		}
	}).catch(err => {
		log.error('Failed to start %d second Twitch Ad:\n\t', durationSeconds, err);
	});
});

function resetTimeSinceTicker(startingMilliseconds = 0) {
	timeSinceTimer.clearInterval();
	timeSince.value = TimeUtils.createTimeStruct(startingMilliseconds);
	timeSinceTimer.setInterval(() => {
		timeSince.value = TimeUtils.createTimeStruct(timeSince.value.raw + 1000);
	}, '', '1s');
}

function resetTimeLeftTicker(durationMilliseconds) {
	timeLeftTimer.clearInterval();
	timeLeft.value = TimeUtils.createTimeStruct(durationMilliseconds);

	if (durationMilliseconds < 0) {
		return;
	}

	timeLeftTimer.setInterval(() => {
		timeLeft.value = TimeUtils.createTimeStruct(timeLeft.value.raw - 1000);
		if (timeLeft.value.raw <= 0) {
			timeLeftTimer.clearInterval();
		}
	}, '', '1s');
}

/**
 * Updates the value of the canPlayTwitchAd replicant, based on the state of
 * the timeLeft, timeSince, and stopwatch Replicants.
 * @returns {undefined}
 */
function updateCanPlay() {
	if (timeLeft.value.raw > 0) {
		canPlayTwitchAd.value.canPlay = false;
		canPlayTwitchAd.value.reason = CANT_PLAY_REASONS.AD_IN_PROGRESS;
		return;
	}

	if (timeSince.value.raw > 0 && timeSince.value.raw < 480 * 1000) {
		canPlayTwitchAd.value.canPlay = false;
		canPlayTwitchAd.value.reason = CANT_PLAY_REASONS.ON_COOLDOWN;
		return;
	}

	if (stopwatch.value.state !== STOPWATCH_STATES.NOT_STARTED &&
		stopwatch.value.state !== STOPWATCH_STATES.FINISHED) {
		canPlayTwitchAd.value.canPlay = false;
		canPlayTwitchAd.value.reason = CANT_PLAY_REASONS.RUN_IN_PROGRESS;
		return;
	}

	canPlayTwitchAd.value.canPlay = true;
	canPlayTwitchAd.value.reason = CANT_PLAY_REASONS.NONE;
}
