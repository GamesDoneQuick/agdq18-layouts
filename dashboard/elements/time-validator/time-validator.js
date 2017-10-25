Polymer({
	is: 'time-validator',

	behaviors: [
		Polymer.IronValidatorBehavior
	],

	validate(value) {
		// This regex validates incomplete times (by design)
		return !value || value.match(/^[0-9]{0,2}:[0-9]{0,2}$/);
	}
});
