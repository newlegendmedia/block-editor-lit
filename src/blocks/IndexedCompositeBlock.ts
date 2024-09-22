import { html, css, TemplateResult } from 'lit';
import { state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { until } from 'lit/directives/until.js';
import { BaseBlock } from './BaseBlock';
import { BlockFactory } from './BlockFactory';
import { ContentId, CompositeContent, ContentReference } from '../content/content';
import { Model } from '../model/model';
import { contentStore } from '../content/ContentStore';
import { ContentFactory } from '../content/ContentFactory';
import { generateId } from '../util/generateId';

export abstract class IndexedCompositeBlock extends BaseBlock {
	@state() protected showAddMenu: boolean = false;

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
				margin-left: var(--spacing-medium);
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
				margin-left: var(--spacing-small);
			}
			.add-menu {
				margin-top: var(--spacing-small);
			}
		`,
	];

	protected renderContent(): TemplateResult {
		if (!this.content || !this.model) {
			return html`<div>Loading...</div>`;
		}

		const childReferences = this.getChildReferences();

		return html`
			<div class="composite indexed">
				<h3 class="composite-title">${this.getBlockTitle()}</h3>
				<div class="composite-content">
					${repeat(
						childReferences,
						(childRef) => childRef.id,
						(childRef, index) => this.renderCompositeItem(childRef, index)
					)}
				</div>
				${this.renderAddButton()} ${this.showAddMenu ? this.renderAddMenu() : ''}
			</div>
		`;
	}

	protected abstract getBlockTitle(): string;

	protected renderCompositeItem(childRef: ContentReference, index: number): TemplateResult {
		return html`
			<div class="composite-item" id="item-${childRef.id}">
				<div class="item-container">${this.renderChildComponent(childRef, index)}</div>
				<button
					class="remove-button"
					@click=${() => this.handleRemove(index)}
					aria-label="Remove item ${index + 1}"
				>
					Remove
				</button>
			</div>
		`;
	}

	protected renderChildComponent(childRef: ContentReference, index: number): TemplateResult {
		return html`
			${until(
				this.createChildComponent(childRef, index),
				html`<span>Loading child component...</span>`
			)}
		`;
	}

	protected async createChildComponent(
		childRef: ContentReference,
		_index: number
	): Promise<TemplateResult> {
		try {
			return await BlockFactory.createComponent(
				this.contentPath.path,
				childRef.id,
				this.modelPath.path,
				childRef.key,
				childRef.type
			);
		} catch (error) {
			console.error(`Error creating child component for ${childRef.id}:`, error);
			return html`<div>Error: ${(error as Error).message}</div>`;
		}
	}

	protected abstract renderAddButton(): TemplateResult;

	protected abstract renderAddMenu(): TemplateResult;

	protected toggleAddMenu() {
		this.showAddMenu = !this.showAddMenu;
	}

	protected async handleRemove(index: number) {
		const confirmed = confirm('Are you sure you want to remove this item?');
		if (confirmed) {
			try {
				await this.removeChildBlock(index);
				this.requestUpdate();
			} catch (error) {
				console.error('Error removing child block:', error);
				// Optionally, show a user-facing error message
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
			// Optionally, show a user-facing error message
		}
	}

	protected async addChildBlock(itemType: Model): Promise<ContentId> {
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
			if (!Array.isArray(updatedContent.children)) {
				updatedContent.children = [];
			}
			(updatedContent.children as ContentReference[]).push(contentReference);
			return updatedContent;
		});

		// Use the correct model path when creating the child component
		await BlockFactory.createComponent(
			this.contentPath.path,
			newChildContent.id,
			this.modelPath.path,
			itemType.key,
			itemType.type
		);

		return newChildContent.id;
	}

	protected async removeChildBlock(index: number): Promise<void> {
		const compositeContent = this.content as CompositeContent;
		if (!compositeContent.children || index < 0 || index >= compositeContent.children.length) {
			return;
		}

		const childReference = (compositeContent.children as ContentReference[])[index];
		if (!childReference) return;

		// Remove the child from the content
		(compositeContent.children as ContentReference[]).splice(index, 1);

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

	protected getChildReferences(): ContentReference[] {
		const compositeContent = this.content as CompositeContent;
		return (compositeContent.children as ContentReference[]) || [];
	}
}
