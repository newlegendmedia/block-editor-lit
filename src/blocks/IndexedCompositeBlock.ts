// IndexedCompositeBlock.ts
//import { CompositeBlock } from './CompositeBlock';
import { BaseBlock } from './BaseBlock';
import { ContentId, CompositeContent } from '../content/content';
import { isCompositeModel, Model } from '../model/model';
import { contentStore } from '../resourcestore';
import { ContentFactory } from '../store/ContentFactory';

export abstract class IndexedCompositeBlock extends BaseBlock {
	protected async addChildBlock(itemType: Model): Promise<ContentId> {
		const { modelInfo, modelDefinition, content } = ContentFactory.createContentFromModel(itemType);

		if (!modelDefinition) {
			return 'Model not Found';
		}

		const newChildContent = await contentStore.create(
			modelInfo,
			modelDefinition,
			content,
			this.contentId
		);

		if (isCompositeModel(itemType)) {
			await contentStore.update(newChildContent.id, (content) => ({
				...content,
				children: [],
			}));
		}

		await this.updateContent((currentContent) => {
			const updatedContent = currentContent as CompositeContent;
			updatedContent.children = [...(updatedContent.children || []), newChildContent.id];
			return updatedContent;
		});

		return newChildContent.id;
	}

	protected async removeChildBlock(index: number): Promise<void> {
		const compositeContent = this.content as CompositeContent;

		const childId = compositeContent.children?.[index];
		if (!childId) return;

		await this.updateContent((currentContent) => {
			const updatedContent = currentContent as CompositeContent;
			updatedContent.children = updatedContent.children?.filter((_, idx) => idx !== index);
			return updatedContent;
		});

		await contentStore.delete(childId);
	}
}
