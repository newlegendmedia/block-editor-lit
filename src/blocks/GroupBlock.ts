import { customElement } from 'lit/decorators.js';
import { IndexedCompositeBlock } from './IndexedCompositeBlock';
import { GroupModel, Model } from '../model/model';

@customElement('group-block')
export class GroupBlock extends IndexedCompositeBlock {
	protected getItemTypes(): Model[] {
		const model = this.model as GroupModel;
		return model.itemTypes;
	}

	protected getBlockTitle(): string {
		return this.model.name || 'Group Block';
	}
}
