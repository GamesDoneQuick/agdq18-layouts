'use strict';

// Packages
const equals = require('deep-equal');
const clone = require('clone');

// Ours
const nodecg = require('./util/nodecg-api-context').get();
const obs = require('./obs');

// To edit the list of checklist items, edit the "default" value of schemas/checklist.json.
// Any changes you make will be fully picked up and integrated next time NodeCG starts.
const checklist = nodecg.Replicant('checklist');
const checklistDefault = checklist.schema.default;
const autoCycleRecordings = nodecg.Replicant('autoCycleRecordings');

// Reconcile differences between persisted value and what we expect the checklistDefault to be.
const persistedValue = checklist.value;
if (!equals(persistedValue, checklistDefault)) {
	const mergedChecklist = clone(checklistDefault);

	for (const category in checklistDefault) {
		if (!{}.hasOwnProperty.call(checklistDefault, category)) {
			continue;
		}

		mergedChecklist[category] = checklistDefault[category].map(task => {
			if (persistedValue[category]) {
				const persistedTask = persistedValue[category].find(({name}) => name === task.name);
				if (persistedTask) {
					return persistedTask;
				}
			}

			return task;
		});
	}

	checklist.value = mergedChecklist;
}

const checklistComplete = nodecg.Replicant('checklistComplete');
checklist.on('change', newVal => {
	let foundIncompleteTask = false;

	for (const category in newVal) {
		if (!{}.hasOwnProperty.call(newVal, category)) {
			continue;
		}

		foundIncompleteTask = newVal[category].some(task => !task.complete);

		if (foundIncompleteTask) {
			break;
		}
	}

	checklistComplete.value = !foundIncompleteTask;
});

module.exports = {
	reset() {
		if (obs.streamingOBSConnected) {
			obs.resetCropping();
			if (autoCycleRecordings.value) {
				obs.cycleRecordings().catch(error => {
					nodecg.log.error('Failed to cycle recordings:', error);
				});
			}
		}

		for (const category in checklist.value) {
			if (!{}.hasOwnProperty.call(checklist.value, category)) {
				continue;
			}

			checklist.value[category].forEach(task => {
				task.complete = false;
			});
		}
	}
};
