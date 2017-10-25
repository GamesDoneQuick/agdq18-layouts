Polymer({
	is: 'time-input',

	properties: {
		invalid: {
			reflectToAttribute: true,
			type: Boolean,
			value: false
		},

		value: {
			notify: true,
			type: String
		},

		_minutes: {
			type: Number
		},

		_seconds: {
			type: Number
		},

		validator: {
			type: String,
			value: 'time-validator'
		}
	},

	behaviors: [
		Polymer.IronValidatableBehavior
	],

	observers: [
		'_computeValue(_minutes,_seconds)'
	],

	setMS(m, s) {
		this._minutes = m < 10 ? `0${m}` : m;
		this._seconds = s < 10 ? `0${s}` : s;
	},

	_computeValue(minutes, seconds) {
		this.value = `${minutes}:${seconds}`;
	}
});
