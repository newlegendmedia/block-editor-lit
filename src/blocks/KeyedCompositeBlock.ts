import { html, css, TemplateResult } from 'lit';
import { state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { until } from 'lit/directives/until.js';
import { BaseBlock } from './BaseBlock';
import { BlockFactory } from './BlockFactory';
import { CompositeContent, ContentReference, KeyedCompositeChildren } from '../content/content';
import { Model } from '../model/model';
import { contentStore } from '../content/ContentStore';
import { ContentFactory } from '../content/ContentFactory';
import { generateId } from '../util/generateId';

export abstract class KeyedCompositeBlock extends BaseBlock {
	@state() protected showAddMenu: boolean = false;
	@state() protected childComponents: Map<string, Promise<TemplateResult>> = new Map();

	static styles = [
		BaseBlock.blockStyles,
		css`
			.composite {
			}
			.composite-title {
				font-size: 16px;
				font-weight: bold;
				margin-top: var(--spacing-xsmall);
				margin-bottom: var(--spacing-small);
			}
			.composite-content {
				display: flex;
				flex-direction: column;
				gap: var(--spacing-medium);
				margin-bottom: var(--spacing-medium);
			}
			.composite-item {
				display: flex;
				align-items: flex-start;
				gap: var(--spacing-medium);
			}
			.item-container {
				flex: 1;
			}
			.remove-button {
				display: none;
				margin-left: var(--spacing-small);
			}
			.add-menu {
				margin-top: var(--spacing-small);
			}
		`,
	];

	protected abstract getBlockTitle(): string;
	protected abstract getModelProperties(): Model[];

	protected renderContent(): TemplateResult<1> {
		if (!this.content || !this.model) {
			return html`<div>Loading...</div>`;
		}

		return html`
			<div class="composite keyed">
				<h3 class="composite-title">${this.getBlockTitle()}</h3>
				<div class="composite-content">
					${repeat(
						this.getModelProperties(),
						(prop) => prop.key,
						(prop) => this.renderCompositeItem(prop)
					)}
				</div>
				${this.renderAddButton()} ${this.showAddMenu ? this.renderAddMenu() : ''}
			</div>
		`;
	}

	protected renderCompositeItem(property: Model): TemplateResult {
		const childKey = property.key;
		return html`
			<div class="composite-item" id="item-${childKey}">
				<div class="item-container">${this.renderChildComponent(property)}</div>
				<button
					class="remove-button"
					@click=${() => this.handleRemove(childKey)}
					aria-label="Remove ${property.name || childKey}"
				>
					Remove
				</button>
			</div>
		`;
	}

	protected renderChildComponent(property: Model): TemplateResult {
		const childKey = property.key;
		return html`
			${until(this.createChildComponent(property), html`<span>Loading ${childKey}...</span>`)}
		`;
	}

	protected async createChildComponent(property: Model): Promise<TemplateResult> {
		try {
			//			const childPath = this.getChildPath(property.key);
			return await BlockFactory.createComponent(
				this.contentPath.path,
				property.key,
				this.modelPath.path,
				property.key,
				property.type
			);
		} catch (error) {
			console.error(`Error creating child component for ${property.key}:`, error);
			return html`<div>Error: ${(error as Error).message}</div>`;
		}
	}

	protected abstract renderAddButton(): TemplateResult;
	protected abstract renderAddMenu(): TemplateResult;

	protected toggleAddMenu() {
		this.showAddMenu = !this.showAddMenu;
	}

	protected async handleRemove(key: string) {
		const confirmed = confirm(`Are you sure you want to remove ${key}?`);
		if (confirmed) {
			try {
				await this.removeChildBlock(key);
				this.requestUpdate();
			} catch (error) {
				console.error('Error removing child block:', error);
			}
		}
	}

	protected async handleAdd(itemType: Model) {
		try {
			await this.addChildBlock(itemType);
			this.showAddMenu = false;
			this.requestUpdate();
		} catch (error) {
			console.error('Error adding child block:', error);
		}
	}

	protected async addChildBlock(itemType: Model): Promise<void> {
		const { modelInfo, content } = ContentFactory.createContentFromModel(itemType);

		const id = generateId('CON');
		modelInfo.key = itemType.key;
		modelInfo.type = itemType.type;

		const newChildContent = await contentStore.create(
			modelInfo,
			content,
			this.content.id,
			this.getChildPath(id),
			id
		);

		const contentReference: ContentReference = {
			id: newChildContent.id,
			key: modelInfo.key,
			type: modelInfo.type,
		};

		// Update the content with the new child reference
		await this.updateContent((currentContent) => {
			const updatedContent = { ...currentContent } as CompositeContent;
			if (!updatedContent.children) {
				updatedContent.children = {};
			}
			(updatedContent.children as KeyedCompositeChildren)[itemType.key] = contentReference;
			return updatedContent;
		});

		await BlockFactory.createComponent(
			this.contentPath.path,
			newChildContent.id,
			this.modelPath.path,
			itemType.key,
			itemType.type
		);
	}

	protected async removeChildBlock(key: string): Promise<void> {
		const compositeContent = this.content as CompositeContent;
		if (!compositeContent.children || !(key in compositeContent.children)) {
			return;
		}

		const childReference = (compositeContent.children as KeyedCompositeChildren)[key];
		if (!childReference) return;

		// Remove the child from the content
		delete (compositeContent.children as KeyedCompositeChildren)[key];

		// Update the content in the store
		await this.updateContent((currentContent) => {
			return {
				...currentContent,
				children: compositeContent.children,
			};
		});

		// Delete the child content
		await contentStore.delete(childReference.id);
	}

	protected getChildReferences(): KeyedCompositeChildren {
		const compositeContent = this.content as CompositeContent;
		return (compositeContent.children as KeyedCompositeChildren) || {};
	}
}
