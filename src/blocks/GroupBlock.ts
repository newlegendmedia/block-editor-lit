import { html, css, TemplateResult } from 'lit';
import { property, customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import type { Property, GroupProperty, PropertyReference } from '../util/model';
import { ComponentFactory } from './app';
import { isGroup, isPropertyReference } from '../util/model';
import { BaseBlock } from './BaseBlock';

interface GroupItem {
	__type: string;
	value: any;
}

@customElement('group-component')
export class GroupBlock extends BaseBlock {
	@property({ type: Object }) override model!: GroupProperty;
	@property({ type: Array }) data: GroupItem[] = [];
	@state() private showSlashMenu: boolean = false;

	static styles = [
		BaseBlock.styles,
		css`
			:host {
				display: block;
				margin-bottom: 10px;
				border: 1px solid var(--border-color);
				padding: 10px;
				border-radius: var(--border-radius);
			}
			.add-button {
				margin-top: 10px;
				margin-right: 5px;
				background-color: var(--primary-color);
				color: white;
				border: none;
				padding: 5px 10px;
				cursor: pointer;
				border-radius: var(--border-radius);
			}
			.slash-menu {
				margin-top: 10px;
			}
			.info {
				color: var(--secondary-color);
				font-style: italic;
			}
			.group-item {
				margin-bottom: 10px;
				padding: 5px;
				border: 1px solid var(--border-color);
				border-radius: var(--border-radius);
			}
			.remove-button {
				background-color: var(--secondary-color);
				color: white;
				border: none;
				padding: 3px 6px;
				cursor: pointer;
				border-radius: var(--border-radius);
				margin-left: 5px;
			}
		`,
	];

	get editable(): boolean {
		return this.model.editable || false;
	}

	protected override renderContent(): TemplateResult {
		return html`
			<div>
				<h3>${this.model.name}</h3>
				${this.renderGroup()} ${this.editable ? this.renderAddButton() : ''}
				${this.editable && this.showSlashMenu ? this.renderSlashMenu() : ''}
			</div>
		`;
	}

	private renderGroup(): TemplateResult {
		if (!Array.isArray(this.data) || this.data.length === 0) {
			return html`<div class="info">This group is currently empty.</div>`;
		}

		return html`
			${repeat(
				this.data,
				(item) => item.__type,
				(item, index) => {
					const itemType = this.getItemTypeByKey(item.__type);
					if (!itemType) {
						return html`<div class="error">Error: Unknown item type ${item.__type}</div>`;
					}
					return html`
						<div class="group-item">
							${ComponentFactory.createComponent(itemType, item.value)}
							${this.editable
								? html`<button class="remove-button" @click=${() => this.removeItem(index)}>
										Remove
								  </button>`
								: ''}
						</div>
					`;
				}
			)}
		`;
	}

	private getItemTypes(): (Property | PropertyReference)[] {
		if (!this.model) {
			console.warn('Model is not defined in GroupComponent');
			return [];
		}

		if (Array.isArray(this.model.itemTypes)) {
			return this.model.itemTypes;
		} else if (isPropertyReference(this.model.itemTypes)) {
			if (!this.library) {
				console.warn('Library is not available in GroupComponent');
				return [];
			}
			const resolved = this.library.getDefinition(
				this.model.itemTypes.ref,
				this.model.itemTypes.type
			);
			if (resolved && isGroup(resolved)) {
				return Array.isArray(resolved.itemTypes) ? resolved.itemTypes : [resolved.itemTypes];
			}
		}
		console.warn(`Invalid itemTypes: ${JSON.stringify(this.model.itemTypes)}`);
		return [];
	}

	private renderAddButton(): TemplateResult {
		return html`<button class="add-button" @click=${this.toggleSlashMenu}>Add Block</button>`;
	}

	private renderSlashMenu(): TemplateResult {
		const itemTypes = this.getItemTypes();
		return html`
			<div class="slash-menu">
				${repeat(
					itemTypes,
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
		this.showSlashMenu = !this.showSlashMenu;
	}

	private getItemTypeByKey(key: string): Property | PropertyReference | undefined {
		const itemTypes = this.getItemTypes();
		return itemTypes.find((itemType) => {
			if (isPropertyReference(itemType)) {
				return itemType.ref === key || itemType.key === key;
			} else if ('key' in itemType && 'type' in itemType) {
				return itemType.key === key || itemType.type === key;
			}
			return false;
		});
	}

	private addBlock(itemType: Property | PropertyReference) {
		try {
			let key: string | undefined;
			if (isPropertyReference(itemType)) {
				key = itemType.ref || itemType.key;
			} else if ('key' in itemType) {
				key = itemType.key;
			}

			if (!key) {
				throw new Error('Unable to determine key for new item');
			}

			const newItem: GroupItem = {
				__type: key,
				value: ComponentFactory.createEmptyItem(itemType),
			};

			this.data = [...this.data, newItem];
			this.showSlashMenu = false;
			this.error = null;
			this.requestUpdate();
			this.dispatchEvent(
				new CustomEvent('value-changed', {
					detail: { key: this.model.key, value: this.data },
					bubbles: true,
					composed: true,
				})
			);
		} catch (error: unknown) {
			console.error('Error adding block:', error);
			if (error instanceof Error) {
				this.error = `Failed to add block: ${error.message}`;
			} else {
				this.error = 'Failed to add block: An unknown error occurred';
			}
			this.requestUpdate();
		}
	}

	private removeItem(index: number) {
		try {
			this.data = this.data.filter((_, i) => i !== index);
			this.error = null;
			this.requestUpdate();
			this.dispatchEvent(
				new CustomEvent('value-changed', {
					detail: { key: this.model.key, value: this.data },
					bubbles: true,
					composed: true,
				})
			);
		} catch (error: unknown) {
			console.error('Error removing item:', error);
			if (error instanceof Error) {
				this.error = `Failed to remove item: ${error.message}`;
			} else {
				this.error = 'Failed to remove item: An unknown error occurred';
			}
			this.requestUpdate();
		}
	}

	protected handleValueChanged(e: CustomEvent) {
		try {
			const { key, value } = e.detail;
			const index = this.data.findIndex((item) => item.__type === key);
			if (index !== -1) {
				const newData = [...this.data];
				newData[index] = { ...newData[index], value };
				this.data = newData;
				this.error = null;
				this.requestUpdate();
				this.dispatchEvent(
					new CustomEvent('value-changed', {
						detail: { key: this.model.key, value: this.data },
						bubbles: true,
						composed: true,
					})
				);
			}
		} catch (error: unknown) {
			console.error('Error handling value change:', error);
			if (error instanceof Error) {
				this.error = `Failed to update value: ${error.message}`;
			} else {
				this.error = 'Failed to update value: An unknown error occurred';
			}
			this.requestUpdate();
		}
	}
}
