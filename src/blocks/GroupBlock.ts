import { html, css, TemplateResult } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { CompositeBlock } from './CompositeBlock';
import { ComponentFactory } from '../util/ComponentFactory';
import { GroupModel, Model, isModelReference } from '../model/model';

@customElement('group-block')
export class GroupBlock extends CompositeBlock<'indexed'> {
	@state() private showSlashMenu: boolean = false;
	@property({ type: Array }) mirroredBlocks: string[] = [];
	
	// Add this line to create a feature toggle
	private enableMirroring: boolean = false; // Set to false to disable mirroring

	static styles = [
		CompositeBlock.styles,
		css`
			.group-content {
				display: flex;
				flex-direction: column;
				gap: var(--spacing-medium);
			}
			.group-item {
				display: flex;
				align-items: flex-start;
				gap: var(--spacing-medium);
			}
			.item-container {
				flex: 1;
			}
			.mirror-container {
				flex: 1;
				border-left: 2px dashed var(--border-color);
				padding-left: var(--spacing-medium);
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
		if (!this.model) {
			return;
		}
	
		// if not editable, add all itemTypes as children
		if (!(this.model as GroupModel).editable) {
			const groupModel = this.model as GroupModel;
			const itemTypes = this.getItemTypes(groupModel);

			if (this.childBlocks.length === 0) {
				itemTypes.forEach((itemType) => this.addChildBlock(itemType, this.childBlocks.length));
			} else {
				console.warn('GroupBlock: Child blocks already initialized');
			}
		}
	}

	renderContent(): TemplateResult {
		if (!this.content || !this.library || !this.model) {
			return html`<div>Group Loading...</div>`;
		}

		const groupModel = this.model as GroupModel;

		return html`
			<div>
				<h3>${groupModel.name || 'Group'}</h3>
				<div class="group-content">
					${repeat(
						this.childBlocks as string[],
						(childId, _index) => childId,
						(childId, index) => html`
							<div class="group-item">
								<div class="item-container">
									${ComponentFactory.createComponent(
										childId,
										this.library!,
										this.getChildPath(index)
									)}
								</div>
								${this.enableMirroring && this.mirroredBlocks[index] ? html`
									<div class="mirror-container">
										${ComponentFactory.createComponent(
											`mirror:${childId}`,
											this.library!,
											`${this.getChildPath(index)}.mirror`
										)}
									</div>
								` : ''}
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
		const newIndex = this.childBlocks.length;
		const newChildId = this.addChildBlock(itemType, newIndex);
		
		// Only add a mirrored block if mirroring is enabled
		if (this.enableMirroring) {
			this.mirroredBlocks = [...this.mirroredBlocks, newChildId];
		}
		
		this.showSlashMenu = false;
		this.requestUpdate();
	}

	protected removeChildBlock(index: number) {
		super.removeChildBlock(index);
		
		// Only remove the mirrored block if mirroring is enabled
		if (this.enableMirroring) {
			this.mirroredBlocks = this.mirroredBlocks.filter((_, i) => i !== index);
		}
		
		this.requestUpdate();
	}
}