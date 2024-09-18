import { BaseBlock } from './BaseBlock';
import { ContentId, CompositeContent } from '../content/content';
import { Model } from '../model/model';
import { contentStore } from '../content/ContentStore';
import { ContentFactory } from '../content/ContentFactory';

export abstract class IndexedCompositeBlock extends BaseBlock {
	protected async addChildBlock(itemType: Model): Promise<ContentId> {
		if (!this.content || !this.model) {
			return 'Failed to add child block - no content or model for parent';
		}
		const { modelInfo, modelDefinition, content } = ContentFactory.createContentFromModel(itemType);

		if (!modelDefinition) {
			return 'Model not Found';
		}
		if (!content) {
			return 'Failed to create child content';
		}

		const compositeContent = this.content as CompositeContent;
		if (!compositeContent.children) {
			compositeContent.children = [];
		}

		const newIndex = compositeContent.children?.length || 0;
		const originalKey = modelInfo.key;
		modelInfo.key = `${newIndex}:${originalKey}`;

		const newChildContent = await contentStore.create(
			modelInfo,
			modelDefinition,
			content,
			this.content.id,
			this.getChildPath(modelInfo.key)
		);

		compositeContent.children.push(modelInfo.key);

		// if (isCompositeModel(itemType)) {
		// 	await contentStore.update(newChildContent.id, (content) => ({
		// 		...content,
		// 		children: [],
		// 	}));
		// }

		// await this.updateContent((currentContent) => {
		// 	const updatedContent = currentContent as CompositeContent;
		// 	updatedContent.children = [...(updatedContent.children || []), newChildContent.id];
		// 	return updatedContent;
		// });

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

		// Update the keys of remaining children
		await this.updateChildrenKeys();
	}

	private async updateChildrenKeys(): Promise<void> {
		const compositeContent = this.content as CompositeContent;
		if (!compositeContent.children) return;

		for (let i = 0; i < compositeContent.children.length; i++) {
			const childId = compositeContent.children[i];
			await contentStore.update(childId, (childContent) => {
				const originalKey = childContent.modelInfo.key.split(':')[1] || childContent.modelInfo.key;
				return {
					...childContent,
					modelInfo: {
						...childContent.modelInfo,
						key: `${i}:${originalKey}`,
					},
				};
			});
		}
	}
}
