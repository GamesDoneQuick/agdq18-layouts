/* eslint-disable comma-style, no-sparse-arrays */
'use strict';
const assert = require('chai').assert;
const {calcOriginalValues, mergeChangesFromTracker} = require('../extension/lib/diff-run');

describe('calcOriginalValues', () => {
	it('should return undefined if there are no changes', () => {
		const original = {name: 'a'};
		const run = {name: 'a'};
		const originalValues = calcOriginalValues(run, original);
		assert.equal(originalValues, undefined);
	});

	it('should error if a new property is added', () => {
		const original = {name: 'a'};
		const run = {name: 'a', newProp: 'newProp'};
		assert.throws(() => {
			calcOriginalValues(run, original);
		}, /Unexpected difference:/);
	});

	it('should error if a property is deleted', () => {
		const original = {name: 'a', category: 'a'};
		const run = {name: 'a'};
		assert.throws(() => {
			calcOriginalValues(run, original);
		}, /Unexpected difference:/);
	});

	it('should calculate the correct diff', () => {
		const original = {
			name: 'a',
			category: 'a',
			estimate: 'a',
			console: 'a',
			releaseYear: 'a',
			runners: [
				{name: 'a', stream: 'a'}
			]
		};

		const run = {
			name: 'b',
			category: 'b',
			estimate: 'b',
			console: 'b',
			releaseYear: 'b',
			runners: [
				{name: 'b', stream: 'b'}
			]
		};
		const originalValues = calcOriginalValues(run, original);
		assert.deepEqual(originalValues, {
			name: 'a',
			category: 'a',
			estimate: 'a',
			console: 'a',
			releaseYear: 'a',
			runners: [
				{name: 'a', stream: 'a'}
			]
		});
	});

	it('should handle the addition of runners', () => {
		const original = {
			name: 'a',
			runners: [
				{name: 'a', stream: 'a'}
			]
		};

		const run = {
			name: 'a',
			runners: [
				{name: 'a', stream: 'a'},
				{name: 'b', stream: 'b'}
			]
		};
		const originalValues = calcOriginalValues(run, original);
		assert.deepEqual(originalValues, {
			runners: [
				,
				{
					name: '',
					stream: ''
				}
			]
		});
	});

	it('should handle the removal of runners', () => {
		const original = {
			name: 'a',
			runners: [
				{name: 'a', stream: 'a'},
				{name: 'a', stream: 'a'}
			]
		};

		const run = {
			name: 'a',
			runners: [
				{name: 'a', stream: 'a'}
			]
		};
		const originalValues = calcOriginalValues(run, original);
		assert.deepEqual(originalValues, {
			runners: [
				,
				{
					name: 'a',
					stream: 'a'
				}
			]
		});
	});

	it('should handle the addition of a runner stream', () => {
		const original = {
			name: 'a',
			runners: [
				{name: 'a'}
			]
		};

		const run = {
			name: 'a',
			runners: [
				{name: 'a', stream: 'a'}
			]
		};

		const originalValues = calcOriginalValues(run, original);
		assert.deepEqual(originalValues, {
			runners: [
				{
					stream: ''
				}
			]
		});
	});

	it('should handle the removal of a runner stream', () => {
		const original = {
			name: 'a',
			runners: [
				{name: 'a', stream: 'a'}
			]
		};

		const run = {
			name: 'a',
			runners: [
				{name: 'a'}
			]
		};

		const originalValues = calcOriginalValues(run, original);
		assert.deepEqual(originalValues, {
			runners: [
				{
					stream: 'a'
				}
			]
		});
	});
});

describe('mergeChangesFromTracker', () => {
	it('should handle updated properties', () => {
		const original = {
			name: 'c',
			runners: [
				{name: 'c', stream: 'a'}
			]
		};

		const run = {
			name: 'b',
			runners: [
				{name: 'b', stream: 'b'}
			],
			originalValues: {
				name: 'a',
				runners: [
					{name: 'a', stream: 'a'}
				]
			}
		};

		const newRun = mergeChangesFromTracker(run, original);
		assert.deepEqual(newRun, {
			name: 'c',
			runners: [
				{name: 'c', stream: 'b'}
			],
			originalValues: {
				runners: [
					{stream: 'a'}
				]
			}
		});
	});

	it('should handle added runners', () => {
		const original = {
			name: 'a',
			runners: [
				{name: 'a', stream: 'a'},
				{name: 'a', stream: 'a'}
			]
		};

		const run = {
			name: 'a',
			runners: [
				{name: 'a', stream: 'a'}
			]
		};

		const newRun = mergeChangesFromTracker(run, original);
		assert.deepEqual(newRun, {
			name: 'a',
			runners: [
				{name: 'a', stream: 'a'},
				{name: 'a', stream: 'a'}
			]
		});
	});

	it('should handle runners removed from the original', () => {
		const original = {
			name: 'a',
			runners: [
				{name: 'a', stream: 'a'}
			]
		};

		const run = {
			name: 'a',
			runners: [
				{name: 'a', stream: 'a'},
				{name: 'a', stream: 'a'}
			]
		};

		const newRun = mergeChangesFromTracker(run, original);
		assert.deepEqual(newRun, {
			name: 'a',
			runners: [
				{name: 'a', stream: 'a'}
			]
		});
	});

	it('should handle runners removed from the run', () => {
		const original = {
			name: 'a',
			runners: [
				{name: 'a', stream: 'a'},
				{name: 'a', stream: 'a'}
			]
		};

		const run = {
			name: 'a',
			runners: [
				{name: 'a', stream: 'a'}
			],
			originalValues: {
				runners: [
					,
					{name: 'a', stream: 'a'}
				]
			}
		};

		const newRun = mergeChangesFromTracker(run, original);
		assert.deepEqual(newRun, {
			name: 'a',
			runners: [
				{name: 'a', stream: 'a'}
			],
			originalValues: {
				runners: [
					,
					{name: 'a', stream: 'a'}
				]
			}
		});
	});

	it('should handle runner properties added to the original', () => {
		const original = {
			name: 'a',
			runners: [
				{name: 'a', stream: 'a'},
				{name: 'a', stream: 'a'}
			]
		};

		const run = {
			name: 'a',
			runners: [
				{name: 'a'},
				{name: 'a', stream: 'b'}
			],
			originalValues: {
				runners: [
					,
					{stream: 'a'}
				]
			}
		};

		const newRun = mergeChangesFromTracker(run, original);
		assert.deepEqual(newRun, {
			name: 'a',
			runners: [
				{name: 'a', stream: 'a'},
				{name: 'a', stream: 'b'}
			],
			originalValues: {
				runners: [
					,
					{stream: 'a'}
				]
			}
		});
	});

	it('should handle runner properties removed from the original', () => {
		const original = {
			name: 'a',
			runners: [
				{name: 'a'}
			]
		};

		const run = {
			name: 'a',
			runners: [
				{name: 'a', stream: 'b'}
			],
			originalValues: {
				runners: [
					{stream: 'a'}
				]
			}
		};

		const newRun = mergeChangesFromTracker(run, original);
		assert.deepEqual(newRun, {
			name: 'a',
			runners: [
				{name: 'a'}
			]
		});
	});

	it('merge updated props from the tracker and remove them from originalValues', () => {
		const original = {
			name: 'c'
		};

		const run = {
			name: 'b',
			originalValues: {
				name: 'a'
			}
		};

		const newRun = mergeChangesFromTracker(run, original);
		assert.deepEqual(newRun, {name: 'c'});
	});

	it('remove keys from originalValues when the original run has been updated to match local changes', () => {
		const original = {
			name: 'b',
			runners: [
				{name: 'a', stream: 'a'}
			]
		};

		const run = {
			name: 'b',
			runners: [
				{name: 'b', stream: 'a'}
			],
			originalValues: {
				name: 'a',
				runners: [
					{name: 'a'}
				]
			}
		};

		const newRun = mergeChangesFromTracker(run, original);
		assert.deepEqual(newRun, {
			name: 'b',
			runners: [
				{name: 'b', stream: 'a'}
			],
			originalValues: {
				runners: [
					{name: 'a'}
				]
			}
		});
	});

	// The structure of the diff changes depending on how many props are in the object. Dumb.
	// This tests the other type of diff that can be generated, which has no `path` property.
	it('ugh', () => {
		const original = {
			name: 'b'
		};

		const run = {
			name: 'b',
			originalValues: {
				name: 'a'
			}
		};

		const newRun = mergeChangesFromTracker(run, original);
		assert.deepEqual(newRun, {
			name: 'b'
		});
	});

	it('does nothing if nothing has changed since last fetch', () => {
		const original = {
			name: 'a'
		};

		const run = {
			name: 'a'
		};

		const newRun = mergeChangesFromTracker(run, original);
		assert.deepEqual(newRun, {name: 'a'});
	});

	it('should merge new changes from the tracker when there are no local changes', () => {
		const original = {
			name: 'b',
			runners: [
				{name: 'a', stream: 'b'}
			]
		};

		const run = {
			name: 'a',
			runners: [
				{name: 'a', stream: 'a'}
			]
		};

		const newRun = mergeChangesFromTracker(run, original);
		assert.deepEqual(newRun, {
			name: 'b',
			runners: [
				{name: 'a', stream: 'b'}
			]
		});
	});
});
