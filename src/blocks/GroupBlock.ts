import { html, css, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { BaseBlock } from './BaseBlock';
import { ComponentFactory } from '../util/ComponentFactory';
import type { GroupProperty, Property, PropertyReference } from '../util/model';
import { blockStore, CompositeBlock } from '../blocks/BlockStore';
import { isPropertyReference } from '../util/model';

@customElement('group-component')
export class GroupBlock extends BaseBlock {
	@state() private childBlockIds: string[] = [];
	@state() private showSlashMenu: boolean = false;

	static styles = [
		BaseBlock.styles,
		css`
			.group-content {
				display: flex;
				flex-direction: column;
				gap: var(--spacing-small);
			}
			.group-item {
				display: flex;
				align-items: center;
			}
			.remove-button {
				margin-left: var(--spacing-small);
			}
			.slash-menu {
				margin-top: var(--spacing-small);
			}
		`,
	];

	connectedCallback() {
		super.connectedCallback();
		this.initializeChildBlocks();
	}

	private initializeChildBlocks() {
		if (!this.block) return;

		const groupModel = this.model as GroupProperty;
		if (!groupModel || groupModel.type !== 'group') return;

		const compositeBlock = this.block as CompositeBlock;
		if (!compositeBlock.children) {
			compositeBlock.children = [];
		}

		this.childBlockIds = compositeBlock.children;

		blockStore.setBlock(compositeBlock);
	}

	protected renderContent(): TemplateResult {
		if (!this.block || !this.library) {
			return html`<div>Loading...</div>`;
		}

		const groupModel = this.getModel() as GroupProperty;
		if (!groupModel || groupModel.type !== 'group') {
			return html`<div>Invalid group model</div>`;
		}

		return html`
			<div>
				<h3>${groupModel.name || 'Group'}</h3>
				<div class="group-content">
					${repeat(
						this.childBlockIds,
						(childId) => childId,
						(childId, index) => html`
							<div class="group-item">
								${ComponentFactory.createComponent(childId, this.library!)}
								${groupModel.editable
									? html`<button class="remove-button" @click=${() => this.removeItem(index)}>
											Remove
									  </button>`
									: ''}
							</div>
						`
					)}
				</div>
				${groupModel.editable ? this.renderAddButton() : ''}
				${this.showSlashMenu ? this.renderSlashMenu() : ''}
			</div>
		`;
	}

	private renderAddButton(): TemplateResult {
		return html`<button @click=${this.toggleSlashMenu}>Add Block</button>`;
	}

	private renderSlashMenu(): TemplateResult {
		const groupModel = this.getModel() as GroupProperty;
		const itemTypes = this.getItemTypes(groupModel);

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

	private getItemTypes(groupModel: GroupProperty): (Property | PropertyReference)[] {
		if (Array.isArray(groupModel.itemTypes)) {
			return groupModel.itemTypes;
		} else if (isPropertyReference(groupModel.itemTypes)) {
			const resolved = this.library!.getDefinition(
				groupModel.itemTypes.ref,
				groupModel.itemTypes.type
			);
			if (resolved && resolved.type === 'group') {
				return this.getItemTypes(resolved as GroupProperty);
			}
		}
		console.warn(`Invalid itemTypes: ${JSON.stringify(groupModel.itemTypes)}`);
		return [];
	}

	private toggleSlashMenu() {
		this.showSlashMenu = !this.showSlashMenu;
	}

	private addBlock(itemType: Property | PropertyReference) {
		const newChildBlock = blockStore.createBlockFromModel(itemType);
		this.childBlockIds = [...this.childBlockIds, newChildBlock.id];

		const compositeBlock = this.block as CompositeBlock;
		compositeBlock.children = this.childBlockIds;
		blockStore.setBlock(compositeBlock);

		this.showSlashMenu = false;
		this.requestUpdate();
	}

	private removeItem(index: number) {
		const removedBlockId = this.childBlockIds[index];
		this.childBlockIds = this.childBlockIds.filter((_, i) => i !== index);

		const compositeBlock = this.block as CompositeBlock;
		compositeBlock.children = this.childBlockIds;
		blockStore.setBlock(compositeBlock);

		blockStore.deleteBlock(removedBlockId);

		this.requestUpdate();
	}

	protected handleValueChanged(e: CustomEvent) {
		const { key, value } = e.detail;
		const index = this.childBlockIds.indexOf(key);
		if (index !== -1) {
			const updatedContent = [...(this.block!.content as any[])];
			updatedContent[index] = value;
			this.updateBlockContent(updatedContent);
		}
	}
}
