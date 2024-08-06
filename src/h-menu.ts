import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';

@customElement('h-menu')
export class HatchMenu extends LitElement {
	static styles = css`
		:host {
			display: none;
			position: absolute;
			background: var(--h-menu-background, #1e1e1e);
			border: 1px solid var(--h-menu-border-color, #333);
			border-radius: var(--h-menu-border-radius, 4px);
			box-shadow: var(--h-menu-box-shadow, 0 2px 10px rgba(0, 0, 0, 0.3));
			z-index: 1000;
			max-height: var(--h-menu-max-height, 400px);
			overflow-y: auto;
			color: var(--h-menu-text-color, #fff);
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial,
				sans-serif;
		}

		:host([open]) {
			display: block;
		}

		.menu-items {
			list-style-type: none;
			margin: 0;
			padding: 0;
		}

		::slotted(*:not([divider])) {
			display: flex;
			align-items: center;
			padding: 8px 12px;
			cursor: pointer;
			user-select: none;
		}

		::slotted(*:not([divider]):hover) {
			background-color: var(--h-menu-item-hover-background, #2f2f2f);
		}

		::slotted([aria-selected='true']) {
			background-color: var(--h-menu-item-selected-background, #3f3f3f);
		}

		::slotted(h-menu-section) {
			padding: 8px 12px;
			font-weight: bold;
			color: var(--h-menu-section-color, #888);
			background-color: var(--h-menu-section-background, #1e1e1e);
			cursor: default;
		}

		::slotted([divider]) {
			height: 1px;
			padding: 0;
			margin: 4px 0;
			background-color: var(--h-menu-divider-color, #333);
			pointer-events: none;
		}

		/* Styles for the scrollbar */
		::-webkit-scrollbar {
			width: 6px;
		}

		::-webkit-scrollbar-thumb {
			background-color: var(--h-menu-scrollbar-color, #555);
			border-radius: 3px;
		}

		::-webkit-scrollbar-track {
			background-color: var(--h-menu-background, #1e1e1e);
		}
	`;

	@property({ type: Boolean, reflect: true })
	open = false;

	@property({ type: Number })
	maxHeight = 300;

	@state()
	private currentIndex = -1;

	private slotRef = createRef<HTMLSlotElement>();

	generateMenuFromJSON(jsonData: any) {
		const fragment = document.createDocumentFragment();

		const processItems = (
			items: any[],
			parentElement: DocumentFragment | HTMLElement = fragment
		) => {
			items.forEach((item, index) => {
				if (item.type === 'section') {
					const section = document.createElement('h-menu-section');
					section.textContent = item.title;
					parentElement.appendChild(section);
					if (item.items) {
						processItems(item.items, section);
					}
					// Add divider after section if it's not the last item
					if (index < items.length - 1) {
						const divider = document.createElement('h-menu-item');
						divider.setAttribute('divider', '');
						parentElement.appendChild(divider);
					}
				} else {
					const menuItem = document.createElement('h-menu-item');
					if (item.icon) menuItem.setAttribute('icon', item.icon);
					if (item.title) menuItem.setAttribute('title', item.title);
					if (item.description) menuItem.setAttribute('description', item.description);
					parentElement.appendChild(menuItem);
				}
			});
		};

		if (Array.isArray(jsonData)) {
			processItems(jsonData);
		} else if (jsonData.sections) {
			processItems(jsonData.sections);
		} else if (typeof jsonData === 'object') {
			processItems([jsonData]);
		}

		// Clear existing menu items and append the new ones
		if (this.slotRef.value) {
			const assignedElements = this.slotRef.value.assignedElements();
			assignedElements.forEach((el) => el.remove());
		}
		this.appendChild(fragment);

		// Trigger a slot change event
		this.slotRef.value?.dispatchEvent(new Event('slotchange'));
	}

	connectedCallback() {
		super.connectedCallback();
		this.addEventListener('keydown', this.handleKeyDown);
		document.addEventListener('mousedown', this.handleOutsideClick);
		this.style.setProperty('--h-menu-max-height', `${this.maxHeight}px`);
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this.removeEventListener('keydown', this.handleKeyDown);
		document.removeEventListener('mousedown', this.handleOutsideClick);
	}

	updated(changedProperties: Map<string, any>) {
		if (changedProperties.has('open')) {
			console.log('Open state changed:', this.open);
		}
		if (changedProperties.has('maxHeight')) {
			this.style.setProperty('--h-menu-max-height', `${this.maxHeight}px`);
		}
	}

	toggle(x: number, y: number) {
		console.log('Toggle called', { x, y, currentOpen: this.open });
		if (this.open) {
			this.close();
		} else {
			this.show(x, y);
		}
	}

	show(x: number, y: number) {
		console.log('Show called', { x, y });
		this.style.left = `${x}px`;
		this.style.top = `${y}px`;
		this.open = true;
		this.currentIndex = -1;
		this.updateSelection();
		this.focus();
		this.requestUpdate();
	}

	close() {
		console.log('Close called');
		this.open = false;
		this.requestUpdate();
	}

	private handleOutsideClick = (event: MouseEvent) => {
		if (this.open && !this.contains(event.target as Node)) {
			console.log('Outside click detected, closing menu');
			this.close();
		}
	};

	private handleKeyDown = (event: KeyboardEvent) => {
		const items = this.getMenuItems();

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				this.currentIndex = (this.currentIndex + 1) % items.length;
				this.updateSelection();
				break;
			case 'ArrowUp':
				event.preventDefault();
				this.currentIndex = (this.currentIndex - 1 + items.length) % items.length;
				this.updateSelection();
				break;
			case 'Enter':
				event.preventDefault();
				if (this.currentIndex >= 0) {
					this.selectItem(items[this.currentIndex]);
				}
				break;
			case 'Escape':
				this.close();
				break;
		}
	};

	private getMenuItems(): HTMLElement[] {
		const slot = this.slotRef.value;
		if (!slot) return [];
		return slot
			.assignedElements()
			.filter(
				(el) =>
					el.hasAttribute('role') &&
					el.getAttribute('role') === 'menuitem' &&
					el.tagName.toLowerCase() !== 'h-menu-section'
			) as HTMLElement[];
	}

	private updateSelection() {
		const items = this.getMenuItems();
		items.forEach((item, index) => {
			item.setAttribute('aria-selected', (index === this.currentIndex).toString());
			if (index === this.currentIndex) {
				item.focus();
			}
		});
	}

	private selectItem(item: HTMLElement) {
		this.dispatchEvent(
			new CustomEvent('item-selected', {
				detail: { item },
				bubbles: true,
				composed: true,
			})
		);
		this.close();
	}

	render() {
		return html`
			<div class="menu-items" role="menu">
				<slot
					${ref(this.slotRef)}
					@slotchange=${this.handleSlotChange}
					@mousedown=${this.handleItemClick}
				></slot>
			</div>
		`;
	}

	private handleSlotChange = () => {
		const items = this.getMenuItems();
		items.forEach((item) => {
			item.setAttribute('role', 'menuitem');
			item.setAttribute('tabindex', '-1');
		});
	};

	private handleItemClick = (event: MouseEvent) => {
		const item = (event.target as HTMLElement).closest('[role="menuitem"]');
		if (item) {
			this.selectItem(item as HTMLElement);
		}
	};
}

@customElement('h-menu-item')
export class HatchMenuItem extends LitElement {
	static styles = css`
		:host {
			display: flex;
			align-items: center;
			padding: 8px 12px;
			cursor: pointer;
			user-select: none;
		}

		:host(:hover) {
			background-color: var(--h-menu-item-hover-background, #2f2f2f);
		}

		:host([aria-selected='true']) {
			background-color: var(--h-menu-item-selected-background, #3f3f3f);
		}

		:host([divider]) {
			height: 1px;
			padding: 0;
			margin: 4px 0;
			background-color: var(--h-menu-divider-color, #333);
			pointer-events: none;
		}

		.menu-item-icon {
			width: 24px;
			height: 24px;
			margin-right: 12px;
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.menu-item-content {
			display: flex;
			flex-direction: column;
		}

		.menu-item-title {
			font-weight: bold;
		}

		.menu-item-description {
			font-size: 0.9em;
			color: var(--h-menu-description-color, #aaa);
		}
	`;

	@property({ type: String, reflect: true })
	icon = '';

	@property({ type: String, reflect: true })
	title = '';

	@property({ type: String, reflect: true })
	description = '';

	render() {
		return html`
			${this.icon ? html`<div class="menu-item-icon">${this.icon}</div>` : ''}
			${this.title || this.description
				? html`
						<div class="menu-item-content">
							${this.title ? html`<div class="menu-item-title">${this.title}</div>` : ''}
							${this.description
								? html`<div class="menu-item-description">${this.description}</div>`
								: ''}
						</div>
				  `
				: ''}
		`;
	}
}

@customElement('h-menu-section')
export class HatchMenuSection extends LitElement {
	static styles = css`
		:host {
			display: block;
			padding: 8px 12px;
			font-weight: bold;
			color: var(--h-menu-section-color, #888);
			background-color: var(--h-menu-section-background, #1e1e1e);
			cursor: default;
		}
	`;

	render() {
		return html`<slot></slot>`;
	}
}
