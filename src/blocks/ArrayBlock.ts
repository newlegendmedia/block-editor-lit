import { customElement } from 'lit/decorators.js';
import { ArrayModel, Model } from '../model/model';
import { IndexedCompositeBlock } from './IndexedCompositeBlock';

@customElement('array-block')
export class ArrayBlock extends IndexedCompositeBlock {
	protected getChildModels(): Model[] {
		const model = this.model as ArrayModel;
		return [model.itemType];
	}

	protected getBlockTitle(): string {
		return this.model.name || 'Array Block';
	}
}
