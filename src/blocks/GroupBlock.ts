import { html, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { IndexedCompositeBlock } from './IndexedCompositeBlock';
import { GroupModel, Model } from '../model/model';

@customElement('group-block')
export class GroupBlock extends IndexedCompositeBlock {
	protected getBlockTitle(): string {
		return (this.model as GroupModel).name || 'Group';
	}

	protected getItemTypes(): Model[] {
		const model = this.model as GroupModel;
		return Array.isArray(model.itemTypes) ? model.itemTypes : [model.itemTypes];
	}
}
