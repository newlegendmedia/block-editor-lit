import { html, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { ComponentFactory } from './app.ts';
import { BaseComponent } from './BaseComponent.ts';
import { isElement, isArray, isObject, isGroup, Property, GroupProperty } from './model.ts';

// Group Component
@customElement('group-component')
export class GroupComponent extends BaseComponent {
	@property({ type: Boolean }) editable: boolean = false;
	@state() private showMenu: boolean = false;

	override renderContent(): TemplateResult {
		if (!isGroup(this.model)) {
			console.warn('Invalid model type for GroupComponent');
			return html``;
		}
		return html`
			<fieldset>
				<legend>${this.model.name}</legend>
				${repeat(
					Object.entries(this.data || {}),
					([key]) => key,
					([key, value]) => ComponentFactory.createComponent(this.getItemTypeByKey(key), value)
				)}
				${this.editable ? this.renderAddButton() : ''}
				${this.showMenu ? this.renderSlashMenu() : ''}
			</fieldset>
		`;
	}

	private renderAddButton(): TemplateResult {
		return html`<button @click=${this.toggleSlashMenu}>Add Block</button>`;
	}

	private renderSlashMenu(): TemplateResult {
		return html`
			<div class="slash-menu">
				${repeat(
					(this.model as GroupProperty).itemTypes,
					(itemType) => itemType.key,
					(itemType) => html`
						<button @click=${() => this.addBlock(itemType)}>
							${itemType.name || itemType.key}
						</button>
					`
				)}
			</div>
		`;
	}

	private toggleSlashMenu() {
		this.showMenu = !this.showMenu;
	}

	private addBlock(itemType: Property) {
		const newData = { ...this.data, [itemType.key!]: this.createEmptyItem(itemType) };
		this.data = newData;
		this.showMenu = false;
		this.requestUpdate();
		this.dispatchEvent(
			new CustomEvent('value-changed', {
				detail: { key: this.model.key, value: this.data },
				bubbles: true,
				composed: true,
			})
		);
	}

	private getItemTypeByKey(key: string): Property {
		return (
			(this.model as GroupProperty).itemTypes.find((itemType) => itemType.key === key) ||
			(this.model as GroupProperty).itemTypes[0]
		);
	}

	private createEmptyItem(itemType: Property): any {
		// Implementation similar to ArrayComponent's createEmptyItem method
		if (isElement(itemType)) {
			return '';
		} else if (isObject(itemType)) {
			return itemType.properties.reduce((acc, prop) => {
				acc[prop.key!] = this.createEmptyItem(prop);
				return acc;
			}, {} as Record<string, any>);
		} else if (isArray(itemType)) {
			return [];
		} else if (isGroup(itemType)) {
			return {};
		}
	}
}