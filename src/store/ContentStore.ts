import { Content, ContentId, ModelInfo } from '../content/content';
import { StorageAdapter } from './StorageAdapter';
import { Model } from '../model/model';
import { SubscriptionManager } from './SubscriptionManager';
import { ContentTree } from './ContentTree';
import { generateId } from '../util/generateId';

export class ContentStore {
	private contentTree: ContentTree;
	private storageAdapter: StorageAdapter;
	private subscriptionManager: SubscriptionManager;

	constructor(storageAdapter: StorageAdapter) {
		this.contentTree = new ContentTree();
		this.storageAdapter = storageAdapter;
		this.subscriptionManager = new SubscriptionManager();
	}

	async getContent<T extends Content>(id: ContentId): Promise<T | undefined> {
		let content = this.contentTree.getContentById(id) as T | undefined;
		if (!content) {
			content = (await this.storageAdapter.loadContent(id)) as T | undefined;
			if (content) {
				this.contentTree.addContent(content);
			}
		}
		return content;
	}

	async createContent<T extends Content>(
		modelInfo: ModelInfo,
		modelDefinition: Model | undefined,
		content: T['content']
	): Promise<T> {
		// get the first 3 letters of the model type and uppercase them and pass them as the prefix to the id
		let prefix = '';
		if (modelInfo.type) {
			prefix = modelInfo.type.slice(0, 3).toUpperCase();
		}
		const id = generateId(prefix) as ContentId;

		const newContent: T = {
			id,
			modelInfo,
			modelDefinition,
			content,
		} as T;

		const existingContent = await this.getContent<T>(id);
		if (existingContent) {
			console.warn(`Content with id ${id} already exists. Updating instead of creating.`);
			return this.updateContent<T>(id, () => newContent);
		}

		try {
			await this.storageAdapter.saveContent(newContent);
		} catch (error) {
			console.error('Error saving content:', error);
			throw error;
		}

		this.contentTree.addContent(newContent);
		this.subscriptionManager.notifyContentChange(id, newContent);

		return newContent;
	}

	async updateContent<T extends Content>(id: ContentId, updater: (content: T) => T): Promise<T> {
		const existingContent = await this.getContent<T>(id);
		if (!existingContent) {
			throw new Error(`Content with id ${id} not found`);
		}

		const updatedContent = updater(existingContent);

		await this.storageAdapter.saveContent(updatedContent);
		this.contentTree.updateContent(updatedContent);
		this.subscriptionManager.notifyContentChange(id, updatedContent);

		return updatedContent;
	}

	async deleteContent(_id: ContentId): Promise<void> {
		//    const content = await this.getContent(id);
		//    this.contentTree.removeContent(id);
		// if (!this.contentTree.isContentShared(id)) {
		//   if (isCompositeContent(content as CompositeContent)) {
		//     await this.deleteCompositeContent(content as CompositeContent);
		//   }
		//   await this.storageAdapter.deleteContent(id);
		//   this.subscriptionManager.notifyContentChange(id, undefined);
		// }
	}

	// private async deleteCompositeContent(content: CompositeContent): Promise<void> {
	//   for (const childId of content.children) {
	//     await this.deleteContent(childId);
	//   }
	// }

	subscribeToContent(id: ContentId, callback: (content: Content | undefined) => void): () => void {
		return this.subscriptionManager.subscribeToContent(id, callback);
	}

	subscribeToAllContent(callback: () => void): () => void {
		return this.subscriptionManager.subscribeToAllContent(callback);
	}

	async getAllContent(): Promise<Content[]> {
		return this.contentTree.getAll();
	}

}
