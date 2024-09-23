import { html, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { IndexedCompositeBlock } from './IndexedCompositeBlock';
import { ArrayModel, Model } from '../model/model';

@customElement('array-block')
export class ArrayBlock extends IndexedCompositeBlock {
	protected async initializeBlock(): Promise<void> {
		await super.initializeBlock();
		this.showAddMenu = true;
	}

	protected async handleAdd(itemType: Model) {
		await super.handleAdd(itemType);
		this.showAddMenu = true;
	}

	protected getBlockTitle(): string {
		return (this.model as ArrayModel).name || 'Array';
	}

	protected renderAddButton(): TemplateResult {
		return html``;
		// const model = this.model as ArrayModel;
		// return model.repeatable
		// 	? html`
		// 			<button @click=${this.toggleAddMenu} aria-label="Add new item">
		// 				Add ${model.itemType.name || model.itemType.key}
		// 			</button>
		// 		`
		// 	: html``;
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
