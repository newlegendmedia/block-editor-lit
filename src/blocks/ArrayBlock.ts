import { customElement } from 'lit/decorators.js';
import { IndexedCompositeBlock } from './IndexedCompositeBlock';
import { ArrayModel, Model } from '../model/model';

@customElement('array-block')
export class ArrayBlock extends IndexedCompositeBlock {
	protected getItemTypes(): Model[] {
		const model = this.model as ArrayModel;
		return [model.itemType];
	}

	protected getBlockTitle(): string {
		return this.model.name || 'Array Block';
	}
}
