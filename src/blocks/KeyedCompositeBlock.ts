import { html, css, TemplateResult } from 'lit';
import { state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { until } from 'lit/directives/until.js';
import { BaseBlock } from './BaseBlock';
import { BlockFactory } from './BlockFactory';
import { Model } from '../model/model';
import { UniversalPath } from '../path/UniversalPath';

export abstract class KeyedCompositeBlock extends BaseBlock {
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
			.property-label {
				display: none;
				font-weight: bold;
				font-size: 14px;
				margin-bottom: var(--spacing-small);
			}
		`,
	];

	protected abstract getBlockTitle(): string;
	protected abstract getModelProperties(): Model[];

	protected renderContent(): TemplateResult {
		if (!this.content || !this.model) {
			return html`<div>Loading...</div>`;
		}
		return html`
			<div>
				<h3 class="composite-title">${this.getBlockTitle()}</h3>
				<div class="composite-content">
					${repeat(
						this.getModelProperties(),
						(prop) => prop.key,
						(prop, index) => this.renderCompositeItem(prop, index)
					)}
				</div>
			</div>
		`;
	}

	protected renderCompositeItem(property: Model, _index: number): TemplateResult {
		const childKey = property.key;
		return html`
			<div class="composite-item" id="item-${childKey}">
				<div class="item-container">
					<div class="property-label">${property.name || childKey}</div>
					${until(this.createChildComponent(property), html`<span>Loading ${childKey}...</span>`)}
				</div>
			</div>
		`;
	}

	protected async createChildComponent(property: Model): Promise<TemplateResult> {
		try {
			const childPath = new UniversalPath(this.path.document, this.path.path + '.' + property.key);

			return await BlockFactory.createComponent(childPath, property.type);
		} catch (error) {
			console.error(`Error creating child component for ${property.key}:`, error);
			return html`<div>Error: ${(error as Error).message}</div>`;
		}
	}
}
