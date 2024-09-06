import { ResourceStore } from './ResourceStore';
import { Content, ContentId, ModelInfo, isCompositeContent } from '../content/content';
import { Model } from '../model/model';
import { StorageAdapter } from './StorageAdapter';
import { generateId } from '../util/generateId';
import { HierarchicalItem } from '../tree/HierarchicalItem';

export class ContentStore extends ResourceStore<ContentId, Content> {
	constructor(storageAdapter: StorageAdapter<Content>) {
		const rootContent: Content = {
			id: 'root' as ContentId,
			modelInfo: { type: 'root', key: 'root' },
			content: {},
		};
		super(storageAdapter, 'root' as ContentId, rootContent);
	}

	async get(id: ContentId): Promise<Content | undefined> {
		return await super.get(id);
	}

	async set(content: Content, parentId?: ContentId): Promise<void> {
		return await super.set(content, parentId);
	}

	async delete(id: ContentId): Promise<void> {
		return super.delete(id);
	}

	async create(
		modelInfo: ModelInfo,
		modelDefinition: Model,
		content: any,
		parentId?: ContentId
	): Promise<Content> {

    ;

    const id = generateId(
			modelInfo.type ? modelInfo.type.slice(0, 3).toUpperCase() : ''
		) as ContentId;
		const newContent: Content = { id, modelInfo, modelDefinition, content };
		;
		await this.addCompositeContent(newContent, parentId);
		return newContent;
	}

	async update(
		id: ContentId,
		updater: (content: Content) => Content
	): Promise<Content | undefined> {
		const content = await this.get(id);
		if (content) {
			const updatedContent = updater(content);
			const parentNode = this.tree.parent(id);
			await this.updateCompositeContent(updatedContent, parentNode?.id, id); // Add the 'id' parameter
			return updatedContent;
		}
		return undefined;
	}

	async addCompositeContent(content: Content, parentId?: ContentId): Promise<void> {
		const existingContent = await this.get(content.id);
		if (existingContent) {
			console.warn(`Content with id ${content.id} already exists. Updating instead of adding.`);
			await this.updateCompositeContent(content);
			return;
		}

		;
		await this.set(content, parentId);

		if (isCompositeContent(content)) {
			for (const childId of content.children) {
				const childContent = await this.get(childId);
				if (childContent) {
					await this.addCompositeContent(childContent, content.id);
				}
			}
		}
	}

	async updateCompositeContent(content: Content, parentId?: ContentId): Promise<void> {
		await this.set(content, parentId);

		if (isCompositeContent(content)) {
			for (const childId of content.children) {
				const childContent = await this.get(childId);
				if (childContent) {
					await this.updateCompositeContent(childContent, content.id);
				}
			}
		}
	}

	async getAll(): Promise<Content[]> {
		return await super.getAll();
	}

	async getAllHierarchical(): Promise<HierarchicalItem<Content>> {
		const content = this.tree.getAllHierarchical();
		return content;
	}

	subscribeAll(callback: () => void): () => void {
		super.subscribeToAll(callback);
		return () => {};
	}
}
