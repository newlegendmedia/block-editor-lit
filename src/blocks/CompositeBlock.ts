import { BaseBlock } from './BaseBlock';
import { ContentId, CompositeContent } from '../content/content';

export type KeyedChildren = Record<string, ContentId>;
export type IndexedChildren = ContentId[];
export type CompositeType = 'keyed' | 'indexed';

export abstract class CompositeBlock<T extends CompositeType> extends BaseBlock {
	protected childBlocks!: T extends 'keyed' ? KeyedChildren : IndexedChildren;
	protected compositeType: CompositeType = 'keyed';

	protected async updateChildStructure(): Promise<void> {
		this.syncChildrenWithContent();
		await this.updateContent((content) => content as CompositeContent);
		this.requestUpdate();
	}

	protected async initializeBlock() {
		await this.initializeChildBlocks();
	}

	protected abstract syncChildrenWithContent(): void;
	protected abstract initializeChildBlocks(): Promise<void>;
	protected abstract initializeIndexedChildren(): Promise<void>;
	protected abstract initializeKeyedChildren(): Promise<void>;
	// protected abstract addChildBlock(
	// 	itemType: Model,
	// 	keyOrIndex?: T extends 'keyed' ? string : number
	// ): Promise<ContentId>;
	protected abstract removeChildBlock(
		keyOrIndex: T extends 'keyed' ? string : number
	): Promise<void>;
	protected abstract getChildPath(childKey: string | number): string;
	protected abstract getChildBlockId(childKey: string | number): string | undefined;
}
