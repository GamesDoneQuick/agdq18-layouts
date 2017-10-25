'use strict';

// Packages
const clone = require('clone');
const diff = require('deep-diff').diff;
const merge = require('lodash.merge');
const objectPath = require('object-path');

/**
 * Calculates the original values for a modified run.
 * @param {Object} run - The modified run (currentRun or nextRun).
 * @param {Object} original - The original run as it exists in the schedule.
 * @returns {Object|undefined} - The original values of any modified properties.
 */
function calcOriginalValues(run, original) {
	run = clone(run);
	delete run.originalValues;
	const differences = diff(original, run);
	if (!differences) {
		return;
	}

	const originalValues = {};
	differences.forEach(difference => {
		switch (difference.kind) {
			case 'N':
				// The only place that 'N' differences can happen is in the "runners" array.
				/* istanbul ignore else: shouldn't be possible to enter the else path */
				if (difference.path[0] === 'runners') {
					if (!originalValues.runners) {
						originalValues.runners = [];
					}

					objectPath.set(originalValues, difference.path, '');
				} else {
					throw new Error(`Unexpected difference:\n${JSON.stringify(difference)}`);
				}

				break;
			case 'D':
				// The only place that 'D' differences can happen is in the "runners" array.
				/* istanbul ignore else: shouldn't be possible to enter the else path */
				if (difference.path[0] === 'runners') {
					if (!originalValues.runners) {
						originalValues.runners = [];
					}

					objectPath.set(originalValues, difference.path, difference.lhs);
				} else {
					throw new Error(`Unexpected difference:\n${JSON.stringify(difference)}`);
				}

				break;
			case 'A':
				// The only place that 'A' differences can happen is in the "runners" array.
				/* istanbul ignore else: shouldn't be possible to enter the else path */
				if (difference.path[0] === 'runners' && difference.path.length === 1) {
					if (!originalValues.runners) {
						originalValues.runners = [];
					}

					switch (difference.item.kind) {
						case 'N':
							originalValues.runners[difference.index] = {name: '', stream: ''};
							break;
						case 'D':
							originalValues.runners[difference.index] = original.runners[difference.index];
							break;
						/* istanbul ignore next: shouldn't be possible to enter default path */
						default:
							throw new Error(`Unexpected difference:\n${JSON.stringify(difference)}`);
					}
				} else {
					throw new Error(`Unexpected difference:\n${JSON.stringify(difference)}`);
				}
				break;
			case 'E':
				objectPath.set(originalValues, difference.path, difference.lhs);
				break;
			/* istanbul ignore next: shouldn't be possible */
			default:
				throw new Error(`Unexpected difference:\n${JSON.stringify(difference)}`);
		}
	});

	return originalValues;
}

/**
 * Given an active run (currentRun or nextRun) and that same unmodified (but formatted) from the schedule,
 * returns a new run object with new changes from the tracker incorporated.
 * @param {Object} run - An active run (currentRun or nextRun)
 * @param {Object} unmodifiedRun - An unmodified (but formatted) run from the schedule.
 * @returns {Object} - The merged run.
 */
function mergeChangesFromTracker(run, unmodifiedRun) {
	// Immediately clone everything, because we can return either and the diffing code
	// relies on currentRun and nextRun never being the same object as what is in the schedule replicant.
	run = clone(run);
	unmodifiedRun = clone(unmodifiedRun);

	if (!run.originalValues) {
		return unmodifiedRun;
	}

	const oldOriginalValues = run.originalValues;
	const newOriginalValues = calcOriginalValues(run, unmodifiedRun);
	if (!newOriginalValues) {
		return unmodifiedRun;
	}

	const differences = diff(oldOriginalValues, newOriginalValues);
	if (!differences) {
		return run;
	}

	differences.forEach(difference => {
		let pathBase;
		let pathTip;
		if (difference.path) {
			pathBase = difference.path.length > 1 ? difference.path.slice(0, -1) : [];
			pathTip = difference.path[difference.path.length - 1];
		}

		switch (difference.kind) {
			case 'E':
				if (difference.path[0] === 'runners' && difference.rhs === '') {
					delete objectPath.get(run, pathBase)[pathTip];
				} else {
					objectPath.set(run, difference.path, difference.rhs);
				}

				delete objectPath.get(run.originalValues, pathBase)[pathTip];
				break;
			case 'N':
				if (typeof difference.rhs === 'object') {
					if (difference.path) {
						merge(objectPath.get(run, pathBase)[pathTip], difference.rhs);
					} else {
						merge(run, difference.rhs);
					}
				} else {
					objectPath.set(run, difference.path, difference.rhs);
				}

				break;
			case 'D':
				if (difference.path) {
					delete objectPath.get(run.originalValues, pathBase)[pathTip];
				} else {
					for (const key in difference.lhs) {
						/* istanbul ignore if */
						if (!{}.hasOwnProperty.call(difference.lhs, key)) {
							continue;
						}

						delete run.originalValues[key];
					}
				}
				break;
			/* istanbul ignore next: shouldn't be possible */
			default:
				throw new Error(`Unexpected difference:\n${JSON.stringify(difference)}`);
		}
	});

	if (run.originalValues) {
		if (run.originalValues.runners) {
			for (let i = 0; i < run.originalValues.runners.length; i++) {
				if (typeof run.originalValues.runners[i] === 'object' &&
					Object.keys(run.originalValues.runners[i]).length === 0) {
					delete run.originalValues.runners[i];
				}
			}

			if (Object.keys(run.originalValues.runners).length === 0) {
				delete run.originalValues.runners;
			}
		}

		if (Object.keys(run.originalValues).length === 0) {
			delete run.originalValues;
		}
	}

	if (run.runners) {
		run.runners = run.runners.filter(runner => {
			return runner.name || runner.stream;
		});
	}

	return run;
}

module.exports = {
	calcOriginalValues,
	mergeChangesFromTracker
};
