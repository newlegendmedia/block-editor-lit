import { html, css, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { until } from 'lit/directives/until.js';
import { IndexedCompositeBlock } from './IndexedCompositeBlock';
import { ComponentFactory } from '../util/ComponentFactory';
import { ArrayModel, Model } from '../model/model';
import { CompositeContent, ContentId } from '../content/content';

@customElement('array-block')
export class ArrayBlock extends IndexedCompositeBlock {
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

	protected async addChildBlock(itemType: Model): Promise<ContentId> {
		const newChildId = await super.addChildBlock(itemType);
		this.requestUpdate();
		return newChildId;
	}

	private renderChildComponent(
		childComponentPromise: Promise<TemplateResult>,
		placeholder: string
	): TemplateResult {
		return html` ${until(childComponentPromise, html`<span>${placeholder}</span>`)} `;
	}

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
							<div class="array-item">
								${this.renderChildComponent(
									ComponentFactory.createComponent(childId, this.path),
									'Loading child component...'
								)}
								<button class="remove-button" @click=${() => this.removeChildBlock(index)}>
									Remove
								</button>
							</div>
						`
					)}
				</div>
				${model.repeatable
					? html`<button @click=${() => this.addChildBlock(model.itemType)}>
							Add ${model.itemType.name || model.itemType.key}
						</button>`
					: ''}
			</div>
		`;
	}
}
