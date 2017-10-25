'use strict';

// Packages
const app = require('express')();
const bodyParser = require('body-parser');
const debounce = require('lodash.debounce');

// Ours
const nodecg = require('./util/nodecg-api-context').get();

const pulsing = nodecg.Replicant('nowPlayingPulsing', {defaultValue: false, persistent: false});
const nowPlaying = nodecg.Replicant('nowPlaying', {defaultValue: {}, persistent: false});
let pulseTimeout;

nodecg.listenFor('pulseNowPlaying', pulse);

const changeSong = debounce(newSong => {
	nowPlaying.value = {
		game: newSong.game,
		title: newSong.title
	};

	// If the graphic is already showing, end it prematurely and show the new song
	if (pulsing.value) {
		clearTimeout(pulseTimeout);
		pulsing.value = false;
	}

	// Show the graphic
	pulse();
}, 2000);

app.use(bodyParser.json());
app.post(`/${nodecg.bundleName}/song`, (req, res, next) => {
	if (typeof req.body !== 'object') {
		res.sendStatus(400);
		return next();
	}

	changeSong(req.body);
	res.sendStatus(200);
});

nodecg.mount(app);

/**
 * Shows the nowPlaying graphic for 12 seconds.
 * @returns {undefined}
 */
function pulse() {
	// Don't stack pulses
	if (pulsing.value) {
		return;
	}

	pulsing.value = true;

	// Hard-coded 12 second duration
	pulseTimeout = setTimeout(() => {
		pulsing.value = false;
	}, 12 * 1000);
}
