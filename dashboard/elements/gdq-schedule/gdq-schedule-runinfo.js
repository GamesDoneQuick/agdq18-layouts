class GdqScheduleRuninfo extends Polymer.Element {
	static get is() {
		return 'gdq-schedule-runinfo';
	}

	static get properties() {
		return {
			notes: {
				type: String,
				observer: '_notesChanged'
			},
			label: {
				type: String,
				reflectToAttribute: true
			}
		};
	}

	_notesChanged(newVal) {
		if (newVal) {
			this.$.notes.querySelector('.value').innerHTML = newVal.replace(/\r\n/g, '<br/>').replace(/\n/g, '<br/>');
		} else {
			this.$.notes.querySelector('.value').innerHTML = '';
		}
	}

	setRun(run) {
		this.name = run.name;
		this.console = run.console;
		this.runners = run.runners;
		this.releaseYear = run.releaseYear;
		this.estimate = run.estimate;
		this.category = run.category;
		this.order = run.order;
		this.notes = run.notes;
		this.coop = run.coop;
		this.originalValues = run.originalValues;
	}

	calcName(name) {
		if (name) {
			return name.split('\\n').join(' ');
		}

		return name;
	}

	calcModified(original) {
		return typeof original === 'undefined' || original === null ? '' : 'modified';
	}
}

customElements.define(GdqScheduleRuninfo.is, GdqScheduleRuninfo);
