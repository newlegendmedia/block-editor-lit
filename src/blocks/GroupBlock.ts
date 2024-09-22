import { html, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { IndexedCompositeBlock } from './IndexedCompositeBlock';
import { GroupModel, Model } from '../model/model';

@customElement('group-block')
export class GroupBlock extends IndexedCompositeBlock {
	protected getBlockTitle(): string {
		return (this.model as GroupModel).name || 'Group';
	}

	protected renderAddButton(): TemplateResult {
		return html`<button @click=${this.toggleAddMenu}>Add Item</button>`;
	}

	protected renderAddMenu(): TemplateResult {
		const model = this.model as GroupModel;
		const itemTypes = Array.isArray(model.itemTypes) ? model.itemTypes : [model.itemTypes];
		return html`
			<div class="add-menu">
				${itemTypes.map(
					(itemType: Model) => html`
						<button @click=${() => this.handleAdd(itemType)}>
							${itemType.name || itemType.key}
						</button>
					`
				)}
			</div>
		`;
	}
}
