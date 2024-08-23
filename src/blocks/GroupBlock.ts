import { html, css, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { CompositeBlock } from './CompositeBlock';
import { ComponentFactory } from '../util/ComponentFactory';
import { GroupModel, Model, isModelReference } from '../model/model';

@customElement('group-block')
export class GroupBlock extends CompositeBlock<'indexed'> {
	@state() private showSlashMenu: boolean = false;

	static styles = [
		CompositeBlock.styles,
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
		this.initializeChildren();
	}

	private initializeChildren() {
		if (!this.model || (this.model as GroupModel).editable) {
			return;
		}

		const groupModel = this.model as GroupModel;
		const itemTypes = this.getItemTypes(groupModel);

		// If there are no children and the group is not editable, add all itemTypes as children
		if (this.childBlocks.length === 0) {
			itemTypes.forEach((itemType) => this.addChildBlock(itemType, this.childBlocks.length));
		}
	}

	renderContent(): TemplateResult {
		if (!this.content || !this.library || !this.model) {
			return html`<div>Loading...</div>`;
		}

		const groupModel = this.model as GroupModel;

		return html`
			<div>
				<h3>${groupModel.name || 'Group'}</h3>
				<div class="group-content">
					${repeat(
						this.childBlocks as string[],
						(childId) => childId,
						(childId, index) => html`
							<div class="group-item">
								${ComponentFactory.createComponent(
									childId,
									this.library!,
									this.getChildPath(index)
								)}
								${groupModel.editable
									? html`<button class="remove-button" @click=${() => this.removeChildBlock(index)}>
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
		return html`<button @click=${this.toggleSlashMenu}>Add Item</button>`;
	}

	private renderSlashMenu(): TemplateResult {
		const groupModel = this.model as GroupModel;
		const itemTypes = this.getItemTypes(groupModel);

		return html`
			<div class="slash-menu">
				${repeat(
					itemTypes,
					(itemType) => itemType.key,
					(itemType) => html`
						<button @click=${() => this.addItem(itemType)}>${itemType.name || itemType.key}</button>
					`
				)}
			</div>
		`;
	}

	private getItemTypes(groupModel: GroupModel): Model[] {
		if (Array.isArray(groupModel.itemTypes)) {
			return groupModel.itemTypes;
		} else if (isModelReference(groupModel.itemTypes)) {
			const resolved = this.library!.getDefinition(
				groupModel.itemTypes.ref,
				groupModel.itemTypes.type
			);
			if (resolved && 'itemTypes' in resolved) {
				return this.getItemTypes(resolved as GroupModel);
			}
		}
		console.warn(`Invalid itemTypes: ${JSON.stringify(groupModel.itemTypes)}`);
		return [];
	}

	private toggleSlashMenu() {
		this.showSlashMenu = !this.showSlashMenu;
	}

	private addItem(itemType: Model) {
		this.addChildBlock(itemType, this.childBlocks.length);
		this.showSlashMenu = false;
	}
}
