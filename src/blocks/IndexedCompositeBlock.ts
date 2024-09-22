import { BaseBlock } from './BaseBlock';
import { ContentId, CompositeContent } from '../content/content';
import { Model } from '../model/model';
import { contentStore } from '../content/ContentStore';
import { ContentFactory } from '../content/ContentFactory';
import { generateId } from '../util/generateId';

export abstract class IndexedCompositeBlock extends BaseBlock {
	protected async addChildBlock(itemType: Model): Promise<ContentId> {
		const { modelInfo, content } = ContentFactory.createContentFromModel(itemType);

		const compositeContent = this.content as CompositeContent;
		if (!compositeContent.children) {
			compositeContent.children = [];
		}

		const id = generateId('CON');
		modelInfo.key = this.modelPath.key;
		modelInfo.type = itemType.type;

		const newChildContent = await contentStore.create(
			modelInfo,
			content,
			this.content.id,
			this.getChildPath(id),
			id
		);

		console.log('JJ Adding childId', id, newChildContent.id, compositeContent.children);
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
