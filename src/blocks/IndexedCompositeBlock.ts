// IndexedCompositeBlock.ts
import { CompositeBlock, IndexedChildren } from './CompositeBlock';
import { ContentId, CompositeContent } from '../content/content';
import { isCompositeModel, Model } from '../model/model';
import { contentStore } from '../resourcestore';
import { ContentFactory } from '../store/ContentFactory';

export abstract class IndexedCompositeBlock extends CompositeBlock<'indexed'> {
	protected syncChildrenWithContent(): void {
		if (!this.content) return;

		const compositeContent = this.content as CompositeContent;
		compositeContent.children = this.childBlocks as IndexedChildren;
		compositeContent.content = this.childBlocks;
	}

	protected async initializeChildBlocks(): Promise<void> {
		if (!this.content || !this.model) return;
		this.initializeIndexedChildren(this.content as CompositeContent);
		await this.updateChildStructure();
	}

	protected initializeIndexedChildren(compositeContent: CompositeContent): void {
		this.childBlocks = Array.isArray(compositeContent.children)
			? (compositeContent.children as IndexedChildren)
			: [];
	}

	protected async initializeKeyedChildren(): Promise<void> {
		throw new Error('Indexed composites do not support keyed children');
	}

	protected async addChildBlock(itemType: Model): Promise<ContentId> {
		const { modelInfo, modelDefinition, content } = ContentFactory.createContentFromModel(itemType);
		if (!modelDefinition) {
			return "Model notFound"; // fix this
		}
		const newChildContent = await contentStore.create(modelInfo, modelDefinition, content, this.contentId);
		const newChildId = newChildContent.id;
	
		if (!this.content) {
		  throw new Error('Content is not initialized');
		}
	
		if (isCompositeModel(itemType)) {
		  await contentStore.update(newChildId, (content) => ({
			...content,
			children: [],
			content: [],
		  }));
		}
	
		await this.updateContent((currentContent) => {
		  const updatedContent = currentContent as CompositeContent;
		  updatedContent.children = [...updatedContent.children, newChildId];
		  return updatedContent;
		});
	
		this.childBlocks = (this.content as CompositeContent).children;
		await this.updateChildStructure();
		return newChildId;
	  }
	
	  protected async removeChildBlock(index: number): Promise<void> {
		const childId = (this.childBlocks as IndexedChildren)[index];
		if (childId) {
		  await this.updateContent((currentContent) => {
			const updatedContent = currentContent as CompositeContent;
			updatedContent.children = updatedContent.children.filter((id) => id !== childId);
			return updatedContent;
		  });
	
		  this.childBlocks = (this.content as CompositeContent).children;
		  await this.updateChildStructure();
		  await contentStore.delete(childId);
		}
	  }

	protected getChildPath(index: number, type?: string): string {
		return type ? `${this.path}.${index}:${type}` : `${this.path}.${index}`;
	}

	protected parseChildPath(path: string): { index: number; type?: string } {
		const parts = path.split('.');
		const lastPart = parts[parts.length - 1];
		const [indexStr, type] = lastPart.split(':');
		return { index: parseInt(indexStr, 10), type };
	}

	protected getChildBlockId(childIndex: number): string | undefined {
		return this.childBlocks[childIndex];
	}
}
