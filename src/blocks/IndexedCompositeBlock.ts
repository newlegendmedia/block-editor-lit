import { html, css, TemplateResult } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { until } from 'lit/directives/until.js';
import { BaseBlock } from './BaseBlock';
import { BlockFactory } from './BlockFactory';
import { Content, ContentId, IndexedCompositeChildren } from '../content/content';
import { Model } from '../model/model';
import { contentStore } from '../content/ContentStore';
import { ContentFactory } from '../content/ContentFactory';
import { generateId } from '../util/generateId';
import { UniversalPath } from '../path/UniversalPath';
import '../module/interface/AddItemMenu';

export abstract class IndexedCompositeBlock extends BaseBlock {
	static styles = [
		BaseBlock.blockStyles,
		css`
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
			.item-controls {
				display: flex;
				gap: var(--spacing-small);
			}
		`,
	];

	protected abstract getBlockTitle(): string;
	protected abstract getItemTypes(): Model[];

	protected renderContent(): TemplateResult {
		return html`
			<div class="composite indexed">
				<h3 class="composite-title">${this.getBlockTitle()}</h3>
				<div class="composite-content">
					${repeat(
						this.getChildReferences(),
						(childRef) => childRef,
						(childRef, index) => {
							return this.renderChild(childRef, index);
						}
					)}
				</div>
				<add-item-menu
					.itemTypes=${this.getItemTypes()}
					.blockTitle=${this.getBlockTitle()}
					@add-item=${this.handleAdd}
				></add-item-menu>
			</div>
		`;
	}

	protected renderChild(childRef: ContentId, index: number): TemplateResult {
		return html`
			<div class="composite-item" id="item-${childRef}">
				<div class="item-container">
					${until(
						this.createChildComponent(childRef),
						html`<span>Loading child component...</span>`
					)}
				</div>
				<div class="item-controls">
					<button
						class="duplicate-button"
						@click=${() => this.handleDuplicate(index)}
						aria-label="Duplicate item ${index + 1}"
					>
						Duplicate
					</button>
					<button
						class="remove-button"
						@click=${() => this.handleRemove(index)}
						aria-label="Remove item ${index + 1}"
					>
						Remove
					</button>
				</div>
			</div>
		`;
	}

	protected getChildReferences(): IndexedCompositeChildren {
		return this.content.children || [];
	}

	protected async handleAdd(event: CustomEvent) {
		const { itemType } = event.detail;
		await this.addChildBlock(itemType);
	}

	protected async handleRemove(index: number) {
		const confirmed = confirm('Are you sure you want to remove this item?');
		if (confirmed) {
			try {
				await this.removeChildBlock(index);
			} catch (error) {
				console.error('Error removing child block:', error);
			}
		}
	}

	protected async handleDuplicate(index: number) {
		try {
			const originalChildRef = this.content.children[index];
			const duplicatedSubtree = await contentStore.duplicateContent(originalChildRef);

			if (duplicatedSubtree) {
				const childContentReference = duplicatedSubtree.id;
				await this.addContentReference(childContentReference);
			}
		} catch (error) {
			console.error('Error duplicating child block:', error);
		}
	}

	protected async addChildBlock(itemType: Model): Promise<void> {
		const childContent = await this.makeDefaultContent(itemType);
		await this.addContentToStore(childContent);
		const childContentReference = childContent.id;
		await this.addContentReference(childContentReference);
	}

	protected async removeChildBlock(index: number): Promise<void> {
		if (!this.content.children || this.content.children.length <= index) {
			throw new Error(`Invalid index: ${index}`);
		}
		await contentStore.delete(this.content.children[index]);
		await this.updateContent((content) => {
			const updatedContent = { ...content };
			updatedContent.children.splice(index, 1);
			return updatedContent;
		});
	}

	protected async createChildComponent(childRef: ContentId): Promise<TemplateResult> {
		let childContent = await contentStore.get(childRef);
		if (!childContent) {
			console.error(`Child content not found: ${childRef}`);
			return html`<div>Child content not found: ${childRef}</div>`;
		}
		try {
			// Create a new UniversalPath using the current path's document ID and path
			const childPath = new UniversalPath(
				this.path.document,
				this.path.path ? `${this.path.path}.${childContent.key}` : childContent.key,
				'.'
			);
			return await BlockFactory.createComponent(childPath, childContent.type);
		} catch (error) {
			console.error(`Error creating child component for ${childRef}:`, error);
			return html`<div>Error: ${(error as Error).message}</div>`;
		}
	}

	protected async makeDefaultContent(itemType: Model): Promise<Content> {
		return {
			id: generateId(itemType.type ? itemType.type.slice(0, 3).toUpperCase() : '') as ContentId,
			...ContentFactory.createContentFromModel(itemType),
		};
	}

	protected async addContentToStore(content: Content): Promise<Content> {
		const childPath = new UniversalPath(this.path.toString());
		childPath.addSegment(content.key, content.key, this.path.segments.length);
		const newContent = await contentStore.add(content, this.path, childPath);
		return newContent;
	}

	protected async addContentReference(contentReference: ContentId): Promise<void> {
		await this.updateContent((content) => {
			if (!content.children) content.children = [];
			content.children.push(contentReference);
			return content;
		});
	}
}
