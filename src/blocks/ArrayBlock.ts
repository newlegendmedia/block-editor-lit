import { html, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { IndexedCompositeBlock } from './IndexedCompositeBlock';
import { ArrayModel } from '../model/model';

@customElement('array-block')
export class ArrayBlock extends IndexedCompositeBlock {
	protected getBlockTitle(): string {
		return (this.model as ArrayModel).name || 'Array';
	}

	protected renderAddButton(): TemplateResult {
		const model = this.model as ArrayModel;
		return model.repeatable
			? html`
					<button @click=${this.toggleAddMenu} aria-label="Add new item">
						Add ${model.itemType.name || model.itemType.key}
					</button>
				`
			: html``;
	}

	protected renderAddMenu(): TemplateResult {
		const model = this.model as ArrayModel;
		return html`
			<div class="add-menu">
				<button @click=${() => this.handleAdd(model.itemType)}>
					${model.itemType.name || model.itemType.key}
				</button>
			</div>
		`;
	}
}
