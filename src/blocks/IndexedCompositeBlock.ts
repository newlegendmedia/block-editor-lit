import { CompositeBlock, IndexedChildren } from './CompositeBlock';
import { ContentId, CompositeContent } from '../content/content';
import { isCompositeModel, Model } from '../model/model';
import { contentStore } from '../store';
import { ContentFactory } from '../store/ContentFactory';

export abstract class IndexedCompositeBlock extends CompositeBlock<'indexed'> {
	protected syncChildrenWithContent(): void {
		const compositeContent = this.content as CompositeContent;
		compositeContent.children = this.childBlocks as IndexedChildren;
		compositeContent.content = this.childBlocks;
  }
  
  protected async initializeChildBlocks(): Promise<void> {
    if (!this.content || !this.model) return;
    this.initializeIndexedChildren(this.content as CompositeContent);
    await this.updateChildStructure();
  }  

	protected initializeIndexedChildren(compositeBlock: CompositeContent): void {
		this.childBlocks = Array.isArray(compositeBlock.children)
			? (compositeBlock.children as IndexedChildren)
			: [];
	}

	protected async initializeKeyedChildren(): Promise<void> {
		// This should never be called for indexed composites
		throw new Error('Indexed composites do not support keyed children');
  }
  
  protected async addChildBlock(itemType: Model): Promise<ContentId> {

    const { modelInfo, modelDefinition, content } = ContentFactory.createContentFromModel(itemType);
    const newChildContent = await contentStore.createContent(modelInfo, modelDefinition, content);
    const newChildId = newChildContent.id;

    if (!this.content) {
      console.error('Content is not initialized');
      return newChildId;
    }

    if (isCompositeModel(itemType)) {
      (newChildContent as CompositeContent).children = [];
      newChildContent.content = [];
    }

    // Add the new child ID only to the children array
    (this.content as CompositeContent).children.push(newChildId);

    // Update the childBlocks to match the content's children
    this.childBlocks = (this.content as CompositeContent).children;

    await this.updateChildStructure();
    return newChildId;
  }

	protected async removeChildBlock(keyOrIndex: number): Promise<void> {
		let childId: ContentId | undefined;

		childId = (this.childBlocks as IndexedChildren)[keyOrIndex as number];
		(this.childBlocks as IndexedChildren).splice(keyOrIndex as number, 1);

		if (childId) {
			await this.updateChildStructure();
			await contentStore.deleteContent(childId);
		}
  }

  protected getChildPath(index: number, type?: string): string {
    return type ? `${this.path}.${index}:${type}` : `${this.path}.${index}`;
  }

  protected parseChildPath(path: string): { index: number, type?: string } {
    const parts = path.split('.');
    const lastPart = parts[parts.length - 1];
    const [indexStr, type] = lastPart.split(':');
    return { index: parseInt(indexStr, 10), type };
  }

  protected getChildBlockId(childKey: number): string | undefined {
    return this.childBlocks[childKey];
  }

}
