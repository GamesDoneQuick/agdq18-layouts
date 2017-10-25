/* global moment */
(function () {
	moment.updateLocale('en', {
		relativeTime: {
			future: 'in %s',
			past: '%s',
			s: 'just now',
			m: '1m',
			mm: '%dm',
			h: '1h',
			hh: '%dh',
			d: '1d',
			dd: '%dd',
			M: '1mo',
			MM: '%dmo',
			y: '1y',
			yy: '%dy'
		}
	});

	Polymer({
		is: 'gdq-time-ago',

		properties: {
			timeago: {
				type: String,
				value: '',
				notify: true
			},
			datetime: {
				type: String,
				value: '0000-00-00T00:00:00.000Z',
				observer: '_datetimeChanged'
			}
		},

		ready() {
			this.restartInterval();
		},

		restartInterval() {
			this.recalculate();
			clearInterval(this.interval);
			this.interval = setInterval(this.recalculate.bind(this), 60000);
		},

		recalculate() {
			this.timeago = moment(new Date(this.datetime)).fromNow();
		},

		_datetimeChanged() {
			this.restartInterval();
		}
	});
})();
