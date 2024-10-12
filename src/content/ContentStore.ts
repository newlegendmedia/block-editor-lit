import { Model } from '../model/model';
import { UniversalPath } from '../path/UniversalPath';
import { ResourceStore } from '../resource/ResourceStore';
import { IndexedDBAdapter } from '../storage/IndexedDBAdapter';
import { StorageAdapter } from '../storage/StorageAdapter';
import { HierarchicalItem } from '../tree/HierarchicalItem';
import { generateId } from '../util/generateId';
import { Content, ContentId } from './content';
import { ContentFactory } from './ContentFactory';

export class ContentStore extends ResourceStore<Content> {
	pathMap: Map<string, ContentId> = new Map();
	private rootContentId: ContentId = 'root' as ContentId;

	constructor(storageAdapter: StorageAdapter<string, Content>) {
		const rootContent: Content = {
			id: 'root' as ContentId,
			type: 'root',
			key: 'root',
			parentId: 'root',
			children: [],
			content: {},
		};
		super(storageAdapter, 'root' as ContentId, rootContent);
	}

	async get(id: ContentId): Promise<Content | undefined> {
		return super.get(id);
	}

	async getByPath(path: UniversalPath): Promise<Content | undefined> {
		const id = this.pathMap.get(path.toString());
		return id ? this.get(id) : undefined;
	}

	async getOrCreateByPath(path: UniversalPath, model: Model): Promise<Content> {
		let content = await this.getByPath(path);
		if (!content) {
			const defaultContent = ContentFactory.createContentFromModel(model);
			content = {
				id: generateId(model.type ? model.type.slice(0, 3).toUpperCase() : '') as ContentId,
				...defaultContent,
			};
			content = await this.add(content, path.getParent(), path);
		}
		return content;
	}

	async set(content: Content, parentId?: ContentId): Promise<void> {
		await super.set(content, parentId);
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
			this.tree.remove(id);
		}
		// Remove from storage
		await this.getStorage().delete(id);

		// Notify subscribers
		this.subscriptions.notify(id, null);
		this.subscriptions.notifyAll();
	}

	async add(content: Content, parentPath: UniversalPath, path: UniversalPath): Promise<Content> {
		let parentId: ContentId | undefined = this.pathMap.get(parentPath.toString());

		// If parentId is not found, check if this is a document root
		if (!parentId && parentPath.isDocumentRoot()) {
			// This is likely a document root, so we'll create it without a parent
			parentId = undefined;
		} else if (!parentId) {
			throw new Error(`Parent content not found at path ${parentPath.toString()}`);
		}
		return await this.create(content, parentId, path);
	}

	async create(content: Content, parentId?: ContentId, path?: UniversalPath): Promise<Content> {
		if (!parentId) {
			parentId = this.rootContentId;
		}

		if (!content.id) {
			content.id = generateId(
				content.type ? content.type.slice(0, 3).toUpperCase() : ''
			) as ContentId;
		}

		await this.addCompositeContent(content, parentId, path);

		return content;
	}

	private async addCompositeContent(
		content: Content,
		parentId?: ContentId,
		path?: UniversalPath
	): Promise<void> {
		await this.set(content, parentId);

		if (path) {
			this.pathMap.set(path.toString(), content.id);
		}

		// if (isCompositeContent(content) && content.children) {
		// 	for (const childId of content.children) {
		// 		const childContent = await this.get(childId);
		// 		if (childContent && path) {
		// 			const childPath = path.createChild(childContent.key, childContent.id);
		// 			await this.addCompositeContent(childContent, content.id, childPath);
		// 		}
		// 	}
		// }
	}

	async update(
		id: ContentId,
		updater: (content: Content) => Content
	): Promise<Content | undefined> {
		const content = await this.get(id);

		if (content) {
			const updatedContent = updater(content);
			const parentNode = this.tree.parent(content);
			await this.set(updatedContent, parentNode?.id as ContentId);
			return updatedContent;
		}
		return undefined;
	}

	async getAll(): Promise<Content[]> {
		return super.getAll();
	}

	async getAllHierarchical(): Promise<HierarchicalItem<Content>> {
		return this.tree.getAllHierarchical();
	}

	async duplicateContent(id: ContentId): Promise<Content | null> {
		const originalContent = await this.get(id);
		if (!originalContent) {
			return null;
		}

		const duplicateContent = JSON.parse(JSON.stringify(originalContent)) as Content;
		duplicateContent.id = generateId(duplicateContent.type.slice(0, 3).toUpperCase()) as ContentId;

		const parentPath = this.getPathForContent(originalContent.parentId as ContentId);
		if (!parentPath) {
			throw new Error(`Parent path not found for content ${id}`);
		}

		const newPath = UniversalPath.fromFullPath(
			parentPath.toString(),
			duplicateContent.key,
			duplicateContent.id
		);
		return this.create(duplicateContent, originalContent.parentId as ContentId, newPath);
	}

	subscribeAll(callback: () => void): () => void {
		return super.subscribeToAll(callback);
	}

	getPathForContent(id: ContentId): UniversalPath | undefined {
		for (const [pathString, contentId] of this.pathMap.entries()) {
			if (contentId === id) {
				return UniversalPath.fromFullPath(pathString);
			}
		}
		return undefined;
	}

	protected getParentId(item: Content): ContentId | undefined {
		const node = this.tree.get(item.id);
		return node?.parentId as ContentId | undefined;
	}
}

// Create a singleton instance of IndexedDBAdapter
const storageAdapter = new IndexedDBAdapter<Content>('content-store', 1);

// Create a singleton instance of ContentStore
export const contentStore = new ContentStore(storageAdapter);
