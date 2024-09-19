import { ResourceStore } from '../resource/ResourceStore';
import { Content, ContentId, ModelInfo } from './content';
import { Model } from '../model/model';
import { StorageAdapter } from '../storage/StorageAdapter';
import { generateId } from '../util/generateId';
import { HierarchicalItem } from '../tree/HierarchicalItem';
import { IndexedDBAdapter } from '../storage/IndexedDBAdapter';

export class ContentStore extends ResourceStore<ContentId, Content> {
	private pathMap: Map<string, ContentId> = new Map();
	private rootContentId: ContentId = 'root' as ContentId;

	constructor(storageAdapter: StorageAdapter<Content>) {
		const rootContent: Content = {
			id: 'root' as ContentId,
			modelInfo: { type: 'root', key: 'root' },
			modelDefinition: { id: 'root', type: 'root', key: 'root' },
			content: {},
		};
		super(storageAdapter, 'root' as ContentId, rootContent);
	}

	async get(id: ContentId): Promise<Content | undefined> {
		const content = await super.get(id);
		return content;
	}

	async getByPath(path: string): Promise<Content | undefined> {
		console.log('ContentStore.getByPath', path, this.pathMap);
		const id = this.pathMap.get(path);
		return id ? this.get(id) : undefined;
	}

	async set(content: Content, parentId?: ContentId, path?: string): Promise<void> {
		// Check if the content already exists in the tree
		const existingNode = this.tree.get(content.id as string);

		if (existingNode) {
			// Update existing node
			existingNode.item = content;

			if (parentId) {
				existingNode.parentId = parentId as string;
			}
		} else {
			// Add new node
			this.tree.add(content, parentId as string | undefined, content.id as string);
		}

		// Update pathMap

		if (path) {
			this.pathMap.set(path, content.id);
		}

		// Update storage
		await this.getStorage().set(content);

		// Notify subscribers
		this.subscriptions.notify(content.id as string, content);
		this.subscriptions.notifyAll();
	}

	async delete(id: ContentId): Promise<void> {
		const content = await this.get(id);

		if (content) {
			// Remove from pathMap
			for (const [path, contentId] of this.pathMap.entries()) {
				if (contentId === id) {
					this.pathMap.delete(path);
					break;
				}
			}
			// Remove from tree
			this.tree.remove(id as string);
		}
		// Remove from storage
		await this.getStorage().delete(id as string);

		// Notify subscribers
		this.subscriptions.notify(id as string, null);
		this.subscriptions.notifyAll();
	}

	async add(content: Content, parentPath: string, path: string): Promise<Content> {
		const parentId = this.pathMap.get(parentPath);
		if (!parentId) {
			throw new Error(`Parent content not found at path ${parentPath}`);
		}

		if (!content.modelDefinition) throw new Error('Model definition is required to add content');

		return await this.create(
			content.modelInfo,
			content.modelDefinition,
			content.content,
			parentId,
			path
		);
	}

	async create(
		modelInfo: ModelInfo,
		modelDefinition: Model,
		content: any,
		parentId: ContentId = this.rootContentId,
		path?: string
	): Promise<Content> {
		const id = generateId(
			modelInfo.type ? modelInfo.type.slice(0, 3).toUpperCase() : ''
		) as ContentId;
		const newContent: Content = { id, modelInfo, modelDefinition, content };

		await this.addCompositeContent(newContent, parentId, path);

		return newContent;
	}

	async update(
		id: ContentId,
		updater: (content: Content) => Content
	): Promise<Content | undefined> {
		const content = await this.get(id);

		if (content) {
			const updatedContent = updater(content);
			const parentNode = this.tree.parent(id as string);
			const path = this.getPathForContent(id);
			await this.set(updatedContent, parentNode?.id as ContentId, path);
			return updatedContent;
		}
		return undefined;
	}

	private async addCompositeContent(
		content: Content,
		parentId?: ContentId,
		path?: string
	): Promise<void> {
		await this.set(content, parentId, path);

		if (path) {
			console.log('ContentStore.addCompositeContent set pathmap', path, content.id);
			this.pathMap.set(path, content.id);
		}

		// Handle nested content if it's a composite type
		if ('children' in content && Array.isArray(content.children)) {
			for (const childId of content.children) {
				const childContent = await this.get(childId);
				if (childContent) {
					const childPath = path
						? `${path}.${childContent.modelInfo.key}`
						: childContent.modelInfo.key;
					await this.addCompositeContent(childContent, content.id, childPath);
				}
			}
		}
	}

	async getAll(): Promise<Content[]> {
		return await super.getAll();
	}

	async getAllHierarchical(): Promise<HierarchicalItem<Content>> {
		return this.tree.getAllHierarchical();
	}

	subscribeAll(callback: () => void): () => void {
		return super.subscribeToAll(callback);
	}

	private getPathForContent(id: ContentId): string | undefined {
		for (const [path, contentId] of this.pathMap.entries()) {
			if (contentId === id) {
				return path;
			}
		}
		return undefined;
	}

	protected getParentId(item: Content): ContentId | undefined {
		const node = this.tree.get(item.id as string);
		return node?.parentId as ContentId | undefined;
	}
}

// Create a singleton instance of IndexedDBAdapter
const storageAdapter = new IndexedDBAdapter<Content>('content-store', 1);

// Create a singleton instance of ContentStore
export const contentStore = new ContentStore(storageAdapter);
