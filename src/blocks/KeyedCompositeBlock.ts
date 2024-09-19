import { BaseBlock } from './BaseBlock';
import { CompositeModel } from '../model/model';

export abstract class KeyedCompositeBlock extends BaseBlock {
	protected inlineChildren: boolean = false;

	protected async initializeBlock() {
		await super.initializeBlock();
		this.inlineChildren = (this.model as CompositeModel).inlineChildren || false;
	}
}
