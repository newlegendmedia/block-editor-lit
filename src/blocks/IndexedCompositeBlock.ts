import { BaseBlock } from './BaseBlock';
import { ContentId, CompositeContent } from '../content/content';
import { Model } from '../model/model';
import { contentStore } from '../content/ContentStore';
import { ContentFactory } from '../content/ContentFactory';

export abstract class IndexedCompositeBlock extends BaseBlock {
	protected async addChildBlock(itemType: Model): Promise<ContentId> {
		const { modelInfo, modelDefinition, content } = ContentFactory.createContentFromModel(itemType);

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

		compositeContent.children.push(newChildContent.id);

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
		if (!compositeContent.children || index < 0 || index >= compositeContent.children.length) {
			return;
		}

		const childId = compositeContent.children[index];
		if (!childId) return;

		// Remove the child from the content
		console.log('JJ Removing childId - index', childId, index, compositeContent.children);
		compositeContent.children.splice(index, 1);
		console.log('JJ children after', compositeContent.children);

		// Update the content in the store
		await this.updateContent((currentContent) => {
			return {
				...currentContent,
				children: compositeContent.children,
			};
		});

		// Delete the child content
		await contentStore.delete(childId);
	}
}
