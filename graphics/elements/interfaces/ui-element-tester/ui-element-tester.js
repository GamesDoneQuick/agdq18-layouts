/**
 * @customElement
 * @polymer
 */
class UiElementTester extends Polymer.Element {
	static get is() {
		return 'ui-element-tester';
	}

	static get properties() {
		return {};
	}

	static calcPropertyInputType(propertyType) {
		switch (propertyType) {
			case String:
				return 'text';
			case Number:
				return 'number';
			case Boolean:
				return 'checkbox';
			default:
				return 'text';
		}
	}

	static createPropertyInput(element, propertyName, property) {
		let input;
		let valuePrefix;

		const elementTesterOpts = property.elementTester || {};
		if (elementTesterOpts.enum) {
			input = document.createElement('paper-dropdown-menu');

			const listBox = document.createElement('paper-listbox');
			listBox.slot = 'dropdown-content';
			listBox.selected = 0;

			property.elementTester.enum.forEach(allowedValue => {
				const item = document.createElement('paper-item');
				item.value = allowedValue;
				item.innerText = allowedValue;
				listBox.appendChild(item);
			});

			input.appendChild(listBox);
		} else {
			input = document.createElement('paper-input');
			input.type = UiElementTester.calcPropertyInputType(property.type);

			if (elementTesterOpts.type) {
				input.type = property.elementTester.type;
			}

			if (input.type === 'color' || input.type === 'checkbox') {
				valuePrefix = document.createElement('div');
				valuePrefix.classList.add('prefix');
				valuePrefix.classList.add(`prefix-${input.type}`);
				valuePrefix.slot = 'prefix';
				valuePrefix.setAttribute('prefix', true);
				valuePrefix.innerText = property.value;
				input.appendChild(valuePrefix);
			}

			if (input.type === 'checkbox') {
				input.alwaysFloatLabel = true;
				input.addEventListener('click', () => {
					input.value = !input.value;
				});
			}

			input.setAttribute('type', input.type);
		}

		input.label = propertyName;
		input.value = property.value;
		input.classList.add('control');

		input.addEventListener('value-changed', e => {
			let newValue = e.detail.value;
			if (e.target.type === 'number') {
				newValue = parseFloat(newValue);
			} else if (e.target.type === 'checkbox') {
				if (newValue === 'false') {
					newValue = false;
				} else if (newValue === 'true') {
					newValue = true;
				}
				newValue = Boolean(newValue);
			}

			if (valuePrefix) {
				valuePrefix.innerText = newValue;
			}

			element[propertyName] = newValue;
		});

		return input;
	}

	ready() {
		super.ready();
		this._elementSlotObserver = new Polymer.FlattenedNodesObserver(this.$.elementSlot, info => {
			this._removeInputs();
			const firstElementNode = info.addedNodes.find(addedNode => addedNode.nodeName !== '#text');
			if (firstElementNode) {
				Polymer.RenderStatus.beforeNextRender(this, () => {
					this._attachToElement(firstElementNode);
				});
			}
		});
	}

	_attachToElement(element) {
		const props = Object.entries(element.constructor.properties)
			.filter(([_, propDecl]) => {
				return !propDecl.readOnly &&
					!propDecl.computed &&
					typeof propDecl.value !== 'function';
			});
		props.forEach(([propName, propDecl]) => {
			const input = UiElementTester.createPropertyInput(element, propName, propDecl);
			this.$.controls.appendChild(input);
		});
	}

	_removeInputs() {
		this.$.controls.innerHTML = '';
	}
}

customElements.define(UiElementTester.is, UiElementTester);
