class GdqRunEditor extends Polymer.MutableData(Polymer.Element) {
	static get is() {
		return 'gdq-run-editor';
	}

	static get properties() {
		return {
			showingOriginal: {
				type: Boolean,
				value: false
			},
			coop: Boolean,
			releaseYear: String,
			console: String,
			estimate: String,
			category: String,
			originalValues: Object,
			name: String
		};
	}

	loadRun(run) {
		this.name = run.name;
		this.category = run.category;
		this.estimate = run.estimate;
		this.console = run.console;
		this.releaseYear = run.releaseYear;
		this.runners = run.runners.map(runner => {
			if (runner) {
				return {name: runner.name, stream: runner.stream};
			}

			return undefined;
		});
		this.coop = run.coop;
		this.originalValues = run.originalValues;
		this.pk = run.pk;
	}

	applyChanges() {
		// We have to build a new runners object.
		const runners = [];
		const runnerNameInputs = this.$.runners.querySelectorAll('paper-input[label^="Runner"]:not([disabled])');
		const runnerStreamInputs = this.$.runners.querySelectorAll('paper-input[label="Twitch Channel"]:not([disabled])');
		for (let i = 0; i < 4; i++) {
			if (runnerNameInputs[i].value || runnerStreamInputs[i].value) {
				runners[i] = {
					name: runnerNameInputs[i].value,
					stream: runnerStreamInputs[i].value
				};
			}
		}

		nodecg.sendMessage('modifyRun', {
			name: this.name,
			category: this.category,
			estimate: this.estimate,
			console: this.console,
			releaseYear: this.releaseYear,
			coop: this.coop,
			runners,
			pk: this.pk
		}, () => {
			this.closest('paper-dialog').close();
		});
	}

	resetRun() {
		nodecg.sendMessage('resetRun', this.pk, () => {
			this.closest('paper-dialog').close();
		});
	}

	calcHide(path, showingOriginal) {
		path = path.split('.');
		const originalPath = path.slice(0);
		originalPath.unshift('originalValues');
		const originalValue = this.get(originalPath);
		const hasOriginal = typeof originalValue !== 'undefined';
		return showingOriginal && hasOriginal;
	}

	showOriginal() {
		this.showingOriginal = true;
	}

	hideOriginal() {
		this.showingOriginal = false;
	}

	_moveRunnerDown(e) {
		const index = parseInt(e.target.closest('[data-index]').getAttribute('data-index'), 10);
		this.runners = this._moveRunner(this.runners, index, 'down');
	}

	_moveRunnerUp(e) {
		const index = parseInt(e.target.closest('[data-index]').getAttribute('data-index'), 10);
		this.runners = this._moveRunner(this.runners, index, 'up');
	}

	/**
	 * Moves a runner up or down in the runners array.
	 * @param {Array} runnersArray - The array of runners to base these changes on.
	 * @param {Number} index - The index of the runner to move in the array.
	 * @param {'up'|'down'} direction - Which direction to move the runner in.
	 * @returns {Array} - An array of runners with the desired runner re-arrangement applied to it.
	 */
	_moveRunner(runnersArray, index, direction) {
		if (isNaN(index)) {
			throw new Error(`Index must be a number, got "${index}" which is a "${typeof index}"`);
		}

		if (index < 0 || index >= 4) {
			throw new Error(`Index must be >= 0 and < 4, got "${index}"`);
		}

		const newRunnersArray = runnersArray.slice(0);
		while (newRunnersArray.length < 4) {
			newRunnersArray.push(undefined);
		}

		const runnerToMove = newRunnersArray.splice(index, 1)[0];
		newRunnersArray.splice(index + (direction === 'up' ? -1 : 1), 0, runnerToMove);
		return newRunnersArray.slice(0, 4);
	}
}

customElements.define(GdqRunEditor.is, GdqRunEditor);
