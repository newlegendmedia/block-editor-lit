import { css, html, TemplateResult } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { until } from 'lit/directives/until.js';
import { Content, ContentId, IndexedCompositeChildren } from '../content/content';
import { ContentFactory } from '../content/ContentFactory';
import { contentStore } from '../content/ContentStore';
import { Model } from '../model/model';
import '../module/interface/AddItemMenu';
import { UniversalPath } from '../path/UniversalPath';
import { generateId } from '../util/generateId';
import { BaseBlock } from './BaseBlock';
import { BlockFactory } from './BlockFactory';

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
	protected abstract getChildModels(): Model[];

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
					.itemTypes=${this.getChildModels()}
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
		try {
			await this.removeChildBlock(index);
		} catch (error) {
			console.error('Error removing child block:', error);
		}
	}

	protected async handleDuplicate(index: number) {
		try {
			const originalChildRef = this.content.children[index];
			const duplicatedSubtree = await contentStore.duplicateItem(originalChildRef);

			if (duplicatedSubtree) {
				await this.updateContent((content) => {
					return content;
				});
			}
		} catch (error) {
			console.error('Error duplicating child block:', error);
		}
	}

	protected async addChildBlock(itemType: Model): Promise<void> {
		const childContent = await this.makeDefaultContent(itemType);
		await this.addContentToStore(childContent);
		await this.updateContent((content) => {
			return content;
		});
	}

	protected async removeChildBlock(index: number): Promise<void> {
		if (!this.content.children || this.content.children.length <= index) {
			throw new Error(`Invalid index: ${index}`);
		}
		await contentStore.remove(this.content.children[index]);
		await this.updateContent((content) => {
			const updatedContent = { ...content };
			updatedContent.children.splice(index, 1);
			return updatedContent;
		});
	}

	protected async createChildComponent(childRef: ContentId): Promise<TemplateResult> {
		let childContent = await contentStore.get(childRef);
		if (!childContent) {
			return html`<div>Child content not found: ${childRef}</div>`;
		}
		try {
			const childPath = UniversalPath.fromPathObject(this.path, childContent.key, childContent.id);
			return await BlockFactory.createComponent(childPath, childContent.type);
		} catch (error) {
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
		const childPath = UniversalPath.fromFullPath(this.path.toString(), content.key);
		return await contentStore.add(content, this.path.toString(), childPath.toString());
	}
}
