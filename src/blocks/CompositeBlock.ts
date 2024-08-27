import { BaseBlock } from './BaseBlock';
import { Content, ContentId, CompositeContent } from '../content/content';
import { contentStore } from '../store/ContentStore';
import { Model, CompositeModel } from '../model/model';

export type KeyedChildren = Record<string, ContentId>;
export type IndexedChildren = ContentId[];
export type CompositeType = 'keyed' | 'indexed';

export abstract class CompositeBlock<T extends CompositeType> extends BaseBlock {
  protected childBlocks!: T extends 'keyed' ? KeyedChildren : IndexedChildren;
  protected compositeType: CompositeType = 'keyed';

  protected abstract syncChildrenWithContent(): void;

  protected async updateChildStructure(): Promise<void> {
    this.syncChildrenWithContent();
    await contentStore.updateContent(this.content!.id, () => this.content as Content);
    this.requestUpdate();
  }

  protected abstract initializeChildBlocks(): Promise<void>;

  protected abstract initializeIndexedChildren(compositeBlock: CompositeContent): void;
  protected abstract initializeKeyedChildren(compositeBlock: CompositeContent, model: CompositeModel): Promise<void>;
  protected abstract addChildBlock(itemType: Model, keyOrIndex?: T extends 'keyed' ? string : number): Promise<ContentId>;
  protected abstract removeChildBlock(keyOrIndex: T extends 'keyed' ? string : number): Promise<void>;
  protected abstract getChildPath(childKey: string | number): string;
  protected abstract getChildBlockId(childKey: string | number): string | undefined;
}