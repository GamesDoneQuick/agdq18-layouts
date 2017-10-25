'use strict';

let context;
module.exports = {
	get() {
		return context;
	},
	set(ctx) {
		context = ctx;
	}
};
