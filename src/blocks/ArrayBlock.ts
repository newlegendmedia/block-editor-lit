// ArrayBlock.ts
import { html, css, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { until } from 'lit/directives/until.js';
import { IndexedCompositeBlock } from './IndexedCompositeBlock';
import { ComponentFactory } from '../util/ComponentFactory';
import { ArrayModel, Model } from '../model/model';
import { ContentId } from '../content/content';
import { contentStore } from '../resourcestore';

@customElement('array-block')
export class ArrayBlock extends IndexedCompositeBlock {
	@state() private childTypes: Map<ContentId, string> = new Map();

	static styles = [
		css`
			.array-content {
				display: flex;
				flex-direction: column;
				gap: var(--spacing-small);
			}
			.array-item {
				display: flex;
				align-items: center;
			}
			.remove-button {
				margin-left: var(--spacing-small);
			}
		`,
	];

	protected async initializeBlock() {
		await super.initializeBlock();
		await this.updateChildTypes();
	}

	private async updateChildTypes() {
		const childTypePromises = (this.childBlocks as ContentId[]).map(async (childId) => {
			const childContent = await contentStore.get(childId);
			return [childId, childContent?.modelInfo.key || 'unknown'] as [ContentId, string];
		});
		const childTypes = await Promise.all(childTypePromises);
		this.childTypes = new Map(childTypes);
		this.requestUpdate();
	}

	protected renderContent(): TemplateResult {
		if (!this.content || !this.model) {
			return html`<div>Loading...</div>`;
		}

		const arrayModel = this.model as ArrayModel;
		const childBlocks = Array.isArray(this.childBlocks) ? this.childBlocks : [];

		return html`
			<div>
				<h3>${arrayModel.name || 'Array'}</h3>
				<div class="array-content">
					${repeat(
						childBlocks,
						(childId) => childId,
						(childId, _index) => html`
							<div class="array-item">
								${until(
									ComponentFactory.createComponent(childId, this.path),
									html`<span>Loading child component...</span>`,
									html`<span>Error loading component</span>`
								)}
								// ... rest of the render logic
							</div>
						`
					)}
				</div>
				${arrayModel.repeatable
					? html`<button @click=${() => this.addChildBlock(arrayModel.itemType)}>
							Add ${arrayModel.itemType.name || 'Item'}
					  </button>`
					: ''}
			</div>
		`;
	}

	protected async addChildBlock(itemType: Model): Promise<ContentId> {
		const newChildId = await super.addChildBlock(itemType);
		await this.updateChildTypes();
		return newChildId;
	}

	protected async removeChildBlock(index: number): Promise<void> {
		await super.removeChildBlock(index);
		await this.updateChildTypes();
	}
}
