import { html, css, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { until } from 'lit/directives/until.js';
import { IndexedCompositeBlock } from './IndexedCompositeBlock';
import { BlockFactory } from './BlockFactory';
import { ArrayModel, Model } from '../model/model';
import { CompositeContent, ContentId } from '../content/content';
import { BaseBlock } from './BaseBlock';

@customElement('array-block')
export class ArrayBlock extends IndexedCompositeBlock {
	static styles = [
		BaseBlock.blockStyles,
		css`
			.array-content {
				display: flex;
				flex-direction: column;
				gap: var(--spacing-small, 8px);
			}
			.array-item {
				display: flex;
				align-items: center;
			}
			.remove-button {
				margin-left: var(--spacing-small, 8px);
			}
			button:focus {
				outline: 2px solid var(--focus-color, #005fcc);
				outline-offset: 2px;
			}
		`,
	];

	/**
	 * Adds a new child block and updates the UI.
	 * @param itemType - The model type of the item to add.
	 * @returns The ContentId of the newly added block.
	 */
	protected async addChildBlock(itemType: Model): Promise<ContentId> {
		try {
			const contentId = await super.addChildBlock(itemType);
			// Optimistic update assumed; if not, ensure super method handles it
			return contentId;
		} catch (error) {
			console.error('Error adding child block:', error);
			// Optionally, show a user-facing error message
			return Promise.reject(error);
		}
	}

	/**
	 * Renders a child component or a placeholder while loading.
	 * @param childComponentPromise - Promise resolving to the child TemplateResult
	 * @param placeholder - Placeholder text while loading
	 * @returns A TemplateResult displaying the child or placeholder.
	 */
	private renderChildComponent(
		childComponentPromise: Promise<TemplateResult>,
		placeholder: string
	): TemplateResult {
		console.log('Rendering child component', this.path.path);
		return html`
			${until(
				childComponentPromise.catch(() => html`<span>Error loading component</span>`),
				html`<span>${placeholder}</span>`
			)}
		`;
	}

	/**
	 * Renders the content of the ArrayBlock.
	 * @returns A TemplateResult representing the component's DOM.
	 */
	protected renderContent(): TemplateResult {
		if (!this.content || !this.model) {
			return html`<div>Loading...</div>`;
		}

		const model = this.model as ArrayModel;
		const children = (this.content as CompositeContent).children || [];

		return html`
			<div>
				<h3>${model.name || 'Array'}</h3>
				<div class="array-content">
					${repeat(
						children,
						(childId) => childId,
						(childId, index) => html`
							<div class="array-item" id="item-${childId}">
								${this.renderChildComponent(
									BlockFactory.createComponent(
										this.path.path,
										`${index}:${model.itemType.key}`,
										model.itemType.type
									),
									'Loading child component...'
								)}
								<button
									class="remove-button"
									@click=${() => this.handleRemove(index)}
									aria-label="Remove item ${index + 1}"
								>
									Remove
								</button>
							</div>
						`
					)}
				</div>
				${model.repeatable
					? html`
							<button @click=${() => this.handleAdd()} aria-label="Add new item">
								Add ${model.itemType.name || model.itemType.key}
							</button>
						`
					: ''}
			</div>
		`;
	}

	/**
	 * Handles the removal of a child block with confirmation.
	 * @param index - The index of the child to remove.
	 */
	private async handleRemove(index: number) {
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

	/**
	 * Handles the addition of a new child block.
	 */
	private async handleAdd() {
		const model = this.model as ArrayModel;
		try {
			await this.addChildBlock(model.itemType);
			this.requestUpdate();
			// Optionally, focus on the new item
		} catch (error) {
			console.error('Error adding child block:', error);
			// Optionally, show a user-facing error message
		}
	}
}
