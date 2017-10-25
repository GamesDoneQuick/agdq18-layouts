'use strict';

const DONATION_STATS_URL = 'https://gamesdonequick.com/tracker/20?json';

// Packages
const request = require('request');

// Ours
const formatDollars = require('../util/format-dollars');
const nodecg = require('./util/nodecg-api-context').get();

const autoUpdateTotal = nodecg.Replicant('autoUpdateTotal');
const bitsTotal = nodecg.Replicant('bits:total');
const total = nodecg.Replicant('total');

autoUpdateTotal.on('change', newVal => {
	if (newVal) {
		nodecg.log.info('Automatic updating of donation total enabled');
		manuallyUpdateTotal(true);
	} else {
		nodecg.log.warn('Automatic updating of donation total DISABLED');
	}
});

if (nodecg.bundleConfig && nodecg.bundleConfig.donationSocketUrl) {
	const socket = require('socket.io-client')(nodecg.bundleConfig.donationSocketUrl);
	let loggedXhrPollError = false;

	socket.on('connect', () => {
		nodecg.log.info('Connected to donation socket', nodecg.bundleConfig.donationSocketUrl);
		loggedXhrPollError = false;
	});

	socket.on('connect_error', err => {
		if (err.message === 'xhr poll error') {
			if (loggedXhrPollError) {
				return;
			}

			loggedXhrPollError = true;
		}

		nodecg.log.error('Donation socket connect_error:', err);
	});

	// Get initial data, then listen for donations.
	updateTotal().then(() => {
		socket.on('donation', data => {
			if (!data || !data.rawAmount) {
				return;
			}

			const donation = formatDonation(data);
			nodecg.sendMessage('donation', donation);

			if (autoUpdateTotal.value) {
				total.value = {
					raw: donation.rawNewTotal,
					formatted: donation.newTotal
				};
			}
		});
	});

	socket.on('disconnect', () => {
		nodecg.log.error('Disconnected from donation socket, can not receive donations!');
	});

	socket.on('error', err => {
		nodecg.log.error('Donation socket error:', err);
	});
} else {
	nodecg.log.warn(`cfg/${nodecg.bundleName}.json is missing the "donationSocketUrl" property.` +
		'\n\tThis means that we cannot receive new incoming PayPal donations from the tracker,' +
		'\n\tand that donation notifications will not be displayed as a result. The total also will not update.');
}

nodecg.listenFor('setTotal', ({type, newValue}) => {
	if (type === 'cash') {
		total.value = {
			raw: parseFloat(newValue),
			formatted: formatDollars(newValue, {cents: false})
		};
	} else if (type === 'bits') {
		bitsTotal.value = parseInt(newValue, 10);
	} else {
		nodecg.log.error('Unexpected "type" sent to setTotal: "%s"', type);
	}
});

// Dashboard can invoke manual updates
nodecg.listenFor('updateTotal', manuallyUpdateTotal);

/**
 * Handles manual "updateTotal" requests.
 * @param {Boolean} [silent = false] - Whether to print info to logs or not.
 * @param {Function} [cb] - The callback to invoke after the total has been updated.
 * @returns {undefined}
 */
function manuallyUpdateTotal(silent, cb = function () {}) {
	if (!silent) {
		nodecg.log.info('Manual donation total update button pressed, invoking update...');
	}

	updateTotal().then(updated => {
		if (updated) {
			nodecg.sendMessage('total:manuallyUpdated', total.value);
			nodecg.log.info('Donation total successfully updated');
		} else {
			nodecg.log.info('Donation total unchanged, not updated');
		}

		cb(null, updated);
	}).catch(error => {
		cb(error);
	});
}

/**
 * Updates the "total" replicant with the latest value from the GDQ Tracker API.
 * @returns {Promise} - A promise.
 */
function updateTotal() {
	return new Promise((resolve, reject) => {
		request(DONATION_STATS_URL, (error, response, body) => {
			if (!error && response.statusCode === 200) {
				let stats;
				try {
					stats = JSON.parse(body);
				} catch (e) {
					nodecg.log.error('Could not parse total, response not valid JSON:\n\t', body);
					return;
				}

				const freshTotal = parseFloat(stats.agg.amount || 0);

				if (freshTotal === total.value.raw) {
					resolve(false);
				} else {
					total.value = {
						raw: freshTotal,
						formatted: formatDollars(freshTotal, {cents: false})
					};
					resolve(true);
				}
			} else {
				let msg = 'Could not get donation total, unknown error';
				if (error) {
					msg = `Could not get donation total:\n${error.message}`;
				} else if (response) {
					msg = `Could not get donation total, response code ${response.statusCode}`;
				}
				nodecg.log.error(msg);
				reject(msg);
			}
		});
	});
}

/**
 * Formats each donation coming in from the socket repeater, which in turn is receiving them
 * from a Postback URL on the tracker.
 * @param {Number} rawAmount - The numeric amount of the donation.
 * @param {Number} rawNewTotal - The new numeric donation total, including this donation.
 * @returns {{amount: String, rawAmount: Number, newTotal: String, rawNewTotal: Number}} - A formatted donation.
 */
function formatDonation({rawAmount, newTotal}) {
	rawAmount = parseFloat(rawAmount);
	const rawNewTotal = parseFloat(newTotal);

	// Format amount
	let amount = formatDollars(rawAmount);

	// If a whole dollar, get rid of cents
	if (amount.endsWith('.00')) {
		amount = amount.substr(0, amount.length - 3);
	}

	return {
		amount,
		rawAmount,
		newTotal: formatDollars(rawNewTotal, {cents: false}),
		rawNewTotal
	};
}
