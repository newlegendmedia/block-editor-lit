import { BaseBlock } from "./BaseBlock";
import { ContentId } from '../content/content';

export type KeyedChildren = Record<string, ContentId>;
export type IndexedChildren = ContentId[];
export type CompositeType = 'keyed' | 'indexed';

export abstract class CompositeBlock<T extends CompositeType> extends BaseBlock {
	protected compositeType: CompositeType = 'keyed';

	protected abstract removeChildBlock(
		keyOrIndex: T extends 'keyed' ? string : number
	): Promise<void>;
	protected abstract getChildPath(childKey: string | number): string;
	protected abstract getChildBlockId(childKey: string | number): string | undefined;
}
