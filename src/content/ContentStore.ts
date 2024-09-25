import { ResourceStore } from '../resource/ResourceStore';
import {
	Content,
	ContentId,
	ModelInfo,
	isCompositeContent,
	KeyedCompositeChildren,
} from './content';
import { Model } from '../model/model';
import { StorageAdapter } from '../storage/StorageAdapter';
import { generateId } from '../util/generateId';
import { HierarchicalItem } from '../tree/HierarchicalItem';
import { IndexedDBAdapter } from '../storage/IndexedDBAdapter';
import { ContentPath } from './ContentPath';
import { ContentFactory } from './ContentFactory';

export class ContentStore extends ResourceStore<ContentId, Content> {
	pathMap: Map<string, ContentId> = new Map();
	private rootContentId: ContentId = 'root' as ContentId;

	constructor(storageAdapter: StorageAdapter<Content>) {
		const rootContent: Content = {
			id: 'root' as ContentId,
			modelInfo: { type: 'root', key: 'root' },
			content: {},
		};
		super(storageAdapter, 'root' as ContentId, rootContent);
	}

	async get(id: ContentId): Promise<Content | undefined> {
		const content = await super.get(id);
		return content;
	}

	async getByPath(path: string): Promise<Content | undefined> {
		const id = this.pathMap.get(path);
		return id ? this.get(id) : undefined;
	}

	async getOrCreateByPath(path: string, model: Model): Promise<Content> {
		let content = await this.getByPath(path);
		if (!content) {
			const defaultContent = ContentFactory.createContentFromModel(model);
			content = {
				id: generateId('CONTENT'),
				...defaultContent,
			};
			const contentPath = new ContentPath(path);
			content = await this.add(content, contentPath.parentPath, path);
		}
		return content;
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
			// Ensure we're only storing ContentReference objects for children
			if (isCompositeContent(content) && Array.isArray(content.children)) {
				content = {
					...content,
					children: content.children.map((child) => ({
						id: child.id,
						key: child.key,
						type: child.type,
					})),
				};
			}

			// Add new node
			this.tree.add(content, parentId as string | undefined, content.id as string);
		}

		// Update pathMap
		if (path) {
			const contentPath = new ContentPath(path);
			this.pathMap.set(contentPath.toString(), content.id);
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

	// async add(content: Content, parentPath: string, path: string): Promise<Content> {
	// 	const parentContentPath = new ContentPath(parentPath);
	// 	const contentPath = new ContentPath(path);
	// 	const parentId = this.pathMap.get(parentContentPath.toString());
	// 	if (!parentId) {
	// 		throw new Error(`Parent content not found at path ${parentPath}`);
	// 	}

	// 	const createdContent = await this.create(
	// 		content.modelInfo,
	// 		content.content,
	// 		parentId,
	// 		contentPath.toString()
	// 	);
	// 	this.pathMap.set(contentPath.toString(), createdContent.id);
	// 	return createdContent;
	// }

	async add(content: Content, parentPath: string, path: string): Promise<Content> {
		const parentContentPath = new ContentPath(parentPath);
		const parentId = this.pathMap.get(parentContentPath.toString());
		if (!parentId) {
			throw new Error(`Parent content not found at path ${parentPath}`);
		}

		return await this.create(content.modelInfo, content.content, parentId, path, content.id);
	}

	async create(
		modelInfo: ModelInfo,
		content: any,
		parentId: ContentId = this.rootContentId,
		path?: string,
		id?: ContentId
	): Promise<Content> {
		if (!id) {
			id = generateId(modelInfo.type ? modelInfo.type.slice(0, 3).toUpperCase() : '') as ContentId;
		}
		const newContent: Content = { id, modelInfo, content };

		await this.addCompositeContent(newContent, parentId, path);

		return newContent;
	}

	private async addCompositeContent(
		content: Content,
		parentId?: ContentId,
		path?: string
	): Promise<void> {
		await this.set(content, parentId, path);

		if (path) {
			const contentPath = new ContentPath(path);
			this.pathMap.set(contentPath.toString(), content.id);
		}

		// Handle nested content if it's a composite type
		// if ('children' in content && content.children) {
		// 	const childrenEntries = Object.entries(content.children as KeyedCompositeChildren);
		// 	for (const [childKey, childRef] of childrenEntries) {
		// 		const childContent = await this.get(childRef.id);
		// 		if (childContent) {
		// 			const childPath = path
		// 				? new ContentPath(path, childKey).toString()
		// 				: ContentPath.fromDocumentId(childContent.modelInfo.key).toString();
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

			const path = this.getPathForContent(id);
			if (!path) {
				console.warn(`Content path not found for ID ${id}`);
				return undefined;
			}
			const oldPath = new ContentPath(path);
			const newPath = new ContentPath(oldPath.parentPath, updatedContent.modelInfo.key);

			const parentNode = this.tree.parent(id as string);
			await this.set(updatedContent, parentNode?.id as ContentId, newPath.toString());
			return updatedContent;
		}
		return undefined;
	}

	async updatePath(oldPath: string, newPath: string): Promise<void> {
		const contentId = this.pathMap.get(oldPath);
		if (contentId) {
			this.pathMap.delete(oldPath);
			this.pathMap.set(newPath, contentId);
		}
	}

	async getAll(): Promise<Content[]> {
		return await super.getAll();
	}

	async getAllHierarchical(): Promise<HierarchicalItem<Content>> {
		const result = this.tree.getAllHierarchical();
		return result;
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
