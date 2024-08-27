import { CompositeBlock, KeyedChildren } from './CompositeBlock';
import { ContentId, CompositeContent, KeyedCompositeContent } from '../content/content';
import { CompositeModel, isCompositeModel, isElement, Model, isObject } from '../model/model';
import { contentStore } from '../store/ContentStore';

export abstract class KeyedCompositeBlock extends CompositeBlock<'keyed'> {
	protected inlineChildren: boolean = false;

	protected syncChildrenWithContent(): void {
		const compositeContent = this.content as CompositeContent;
		compositeContent.children = Object.values(this.childBlocks as KeyedChildren);
		compositeContent.content = this.childBlocks;
	}

  protected async initializeChildBlocks(): Promise<void> {
    if (!this.content || !this.model) return;

    await this.initializeKeyedChildren(this.content as CompositeContent, (this.model as CompositeModel));

    await this.updateChildStructure();
  }

	protected initializeIndexedChildren(): void {
		throw new Error('Keyed composites do not support indexed children');
	}

	protected async initializeKeyedChildren(
		compositeBlock: CompositeContent,
		model: CompositeModel
	): Promise<void> {
		const childProperties = this.getChildProperties(model);
		this.childBlocks = {} as KeyedChildren;

		for (const prop of childProperties) {
			if (this.inlineChildren && isElement(prop)) {
				(this.childBlocks as Record<string, any>)[prop.key!] = null;
			} else {
				let childContentId: string | undefined;

				// Find existing child content
				for (const childId of compositeBlock.children) {
					const childBlock = await contentStore.getContent(childId);
					if (childBlock && childBlock.modelInfo.key === prop.key) {
						childContentId = childId;
						break;
					}
				}

				// If child content doesn't exist, create it
				if (!childContentId) {
					const childBlock = await contentStore.createContent(prop);
					childContentId = childBlock.id;
					compositeBlock.children.push(childContentId);
				}

				(this.childBlocks as KeyedChildren)[prop.key!] = childContentId;
			}
		}
	}

	private getChildProperties(model: CompositeModel): Model[] {
		if (isObject(model)) {
			return model.properties;
		}
		// This should never happen for keyed composites, but we'll return an empty array just in case
		return [];
	}

	protected async addChildBlock(itemType: Model, keyOrIndex?: string): Promise<ContentId> {
		const newChildContent = await contentStore.createContent(itemType);
		const newChildId = newChildContent.id;

		if (!this.content) {
			alert('Content is not initialized');
			return newChildId;
		}

		// Initialize the new child content properly
		if (isCompositeModel(itemType)) {
			(newChildContent as CompositeContent).children = [];
			newChildContent.content = {};
		}

		const key = (keyOrIndex as string) || newChildId;
		(this.childBlocks as KeyedChildren)[key] = newChildId;
		(this.content.content as KeyedCompositeContent)[key] = newChildId;

		const compositeContent = this.content as CompositeContent;
		compositeContent.children.push(newChildId);

		return newChildId;
	}

	protected async removeChildBlock(keyOrIndex: string): Promise<void> {
		let childId: ContentId | undefined;

		childId = (this.childBlocks as KeyedChildren)[keyOrIndex as string];
		delete (this.childBlocks as KeyedChildren)[keyOrIndex as string];

		if (childId) {
			await this.updateChildStructure();
			await contentStore.deleteContent(childId);
		}
  }
  
  protected getChildPath(childKey: string): string {
      return `${this.path}.${childKey}` 
  }

  protected getChildBlockId(childKey: string): string {
      return this.childBlocks[childKey as string]
  }

}
