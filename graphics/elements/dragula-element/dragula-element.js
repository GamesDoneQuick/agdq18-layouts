/* global dragula */
/* eslint-disable valid-jsdoc */
class DraguleElement extends Polymer.Element {
	static get is() {
		return 'dragula-element';
	}

	static get properties() {
		return {
			/**
			 * The class for elements designated as drag handles within this group.
			 * If left undefined, `moves` will determine if an element is grabbed.
			 *
			 * @attribute handleClass
			 * @type String
			 */
			handleClass: {
				type: String
			},

			/**
			 * The class for an element that serves as custom container.
			 * If left undefined, `<dragula-element>` will use itself as container.
			 *
			 * @attribute containerClass
			 * @type String
			 */
			containerClass: {
				type: String
			},

			/**
			 * Return the drake object of the current group.
			 * To make elements draggable between different `dragula-element`s,
			 * you should data-bind this object to the other `dragula-element`s.
			 *
			 * @attribute drake
			 * @type Boolean
			 */
			drake: {
				type: Object,
				notify: true
			},

			/**
			 * If left undefined, `dragula-element` will add itself as container.
			 * @attribute containers
			 * @type Array
			 */
			containers: {
				type: Array
			},

			/**
			 * @attribute direction
			 * @type string
			 * @default `vertical`
			 */
			direction: {
				type: String,
				value: 'vertical'
			},

			/**
			 * @attribute copy
			 * @type Boolean
			 * @default `false`
			 */
			copy: {
				type: Boolean,
				value: false
			},

			/**
			 * @attribute copySortSource
			 * @type Boolean
			 * @default `false`
			 */
			copySortSource: {
				type: Boolean,
				value: false
			},

			/**
			 * @attribute revertOnSpill
			 * @type Boolean
			 * @default `false`
			 */
			revertOnSpill: {
				type: Boolean,
				value: false
			},

			/**
			 * @attribute removeOnSpill
			 * @type Boolean
			 * @default `false`
			 */
			removeOnSpill: {
				type: Boolean,
				value: false
			},

			/**
			 * If left undefined, the mirror will be placed in the enclosing element's
			 * shadow root to aid styling. If there is no shadow root, `document.body`
			 * will be used.
			 *
			 * @attribute mirrorContainer
			 * @type Object
			 * @default parent shadow root or `document.body`
			 */
			mirrorContainer: Object,

			/**
			 * @attribute ignoreInputTextSelection
			 * @type Boolean
			 * @default `true`
			 */
			ignoreInputTextSelection: {
				type: Boolean,
				value: true
			}
		};
	}

	connectedCallback() {
		super.connectedCallback();
		if (!this.drake || !this.drake.containers) {
			let mirrorContainer;
			const root = this.getRootNode();
			if (root === document) {
				mirrorContainer = document.body;
			} else {
				mirrorContainer = root.getElementById('mirrorContainer');
			}
			if (!mirrorContainer) {
				mirrorContainer = document.createElement('div');
				mirrorContainer.setAttribute('id', 'mirrorContainer');
				root.appendChild(mirrorContainer);
			}

			this.drake = dragula(this.containers, {
				isContainer: function (element) {
					return this.isContainer(element);
				}.bind(this),

				moves: function (element, source, handle, sibling) {
					if (this.handleClass) {
						return handle.classList.contains(this.handleClass);
					}

					return this.moves(element, source, handle, sibling);
				}.bind(this),

				accepts: function (element, source, handle, sibling) {
					return this.accepts(element, source, handle, sibling);
				}.bind(this),

				invalid: function (element, handle) {
					return this.invalid(element, handle);
				}.bind(this),

				copy: function () {
					return this.copy;
				}.bind(this),

				copySortSource: function () {
					return this.copySortSource;
				}.bind(this),

				ignoreInputTextSelection: function () {
					return this.ignoreInputTextSelection;
				}.bind(this),

				direction: this.direction,
				revertOnSpill: this.revertOnSpill,
				removeOnSpill: this.removeOnSpill,
				mirrorContainer: this.mirrorContainer || mirrorContainer,
				createMirror: function (el) {
					return this.createMirror(el);
				}.bind(this)
			});

			[
				'cancel', 'cloned', 'drag',
				'dragend', 'drop', 'out',
				'over', 'remove', 'shadow'
			].forEach(eventType => {
				this.drake.on(eventType, (el, source) => {
					this.dispatchEvent(new CustomEvent(`dragula-${eventType}`, {
						detail: {el, source},
						bubbles: true,
						composed: true
					}));
				});
			});

			this.drake.referenceCount = 0;
		}

		if (!this.containers) {
			this.drake.containers.push(Polymer.dom(this).querySelector('.' + this.containerClass) || this);
		}
		this.drake.referenceCount++;
	}

	detached() {
		this.drake.referenceCount--;
		if (this.drake.referenceCount === 0) {
			this.drake.destroy();
			this.drake = undefined;
		}
	}

	/**
	 * Function that returns a custom mirror element.
	 * Override to provide your own custom mirror.
	 */
	createMirror(originalElement) { // eslint-disable-line no-unused-vars
		return undefined;
	}

	/**
	 * @return {Boolean}
	 */
	isContainer(element) { // eslint-disable-line no-unused-vars
		return false;
	}

	/**
	 * @return {Boolean}
	 */
	moves(element, source, handle, sibling) { // eslint-disable-line no-unused-vars
		return true;
	}

	/**
	 * @return {Boolean}
	 */
	accepts(element, source, handle, sibling) { // eslint-disable-line no-unused-vars
		return true;
	}

	/**
	 * @return {Boolean}
	 */
	invalid(element, handle) { // eslint-disable-line no-unused-vars
		return false;
	}
}

customElements.define(DraguleElement.is, DraguleElement);
