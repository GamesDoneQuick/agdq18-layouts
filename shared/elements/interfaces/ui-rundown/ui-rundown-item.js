class UiRundownItem extends Polymer.Element {
	static get is() {
		return 'ui-rundown-item';
	}

	static get properties() {
		return {
			item: {
				type: Object,
				observer: '_itemChanged'
			},
			itemType: {
				type: String,
				reflectToAttribute: true,
				readOnly: true
			},
			current: {
				type: Boolean,
				reflectToAttribute: true
			},
			name: String
		};
	}

	_itemChanged(item) {
		this._setItemType(item ? item.type : '');
		this.$.topRight.innerHTML = '';
		this.$.bottomLeft.innerHTML = '';
		this.$.bottomRight.innerHTML = '';

		switch (item.type) {
			case 'run':
				this.name = item.name.replace(/\\n/g, ' ');
				this.$.topRight.innerHTML = item.category;

				this.$.bottomRight.textContent = `${item.console} - ${item.estimate}`;

				item.runners.forEach(runner => {
					const span = document.createElement('span');
					span.textContent = `${runner.name}, `;
					this.$.bottomLeft.appendChild(span);
				});

				this.$.bottomLeft.lastChild.textContent =
					this.$.bottomLeft.lastChild.textContent.substr(0, this.$.bottomLeft.lastChild.textContent.length - 2);
				break;
			case 'adBreak':
				this.name = 'Ad Break';
				item.ads.forEach(ad => {
					const span = document.createElement('span');
					span.textContent = `${ad.adType} - ${ad.filename}`;
					this.$.topRight.appendChild(span);
				});
				break;
			case 'interview':
				this.name = `INTERVIEW - ${item.subject}`;
				item.interviewers.forEach(interviewer => {
					const span = document.createElement('span');
					span.textContent = `${interviewer}, `;
					span.classList.add('interviewer');
					this.$.topRight.appendChild(span);
				});
				item.interviewees.forEach(interviewees => {
					const span = document.createElement('span');
					span.textContent = `${interviewees}, `;
					this.$.topRight.appendChild(span);
				});
				this.$.topRight.lastChild.textContent =
					this.$.topRight.lastChild.textContent.substr(0, this.$.topRight.lastChild.textContent.length - 2);
				break;
			default:
				throw new Error(`'Unexpected content type "${item.type}" in item: ${JSON.stringify(item)}`);
		}
	}

	_itemHasNotes(item) {
		return item && item.notes && item.notes.trim().length > 0;
	}
}

customElements.define(UiRundownItem.is, UiRundownItem);
