import { ResourceStore } from "./ResourceStore";
import {
  Content,
  ContentId,
  ModelInfo,
  isCompositeContent,
} from "../content/content";
import { Model } from "../model/model";
import { StorageAdapter } from "./StorageAdapter";
import { generateId } from "../util/generateId";
import { HierarchicalItem } from "../tree/HierarchicalItem";

export class ContentStore extends ResourceStore<ContentId, Content> {
	private pathMap: Map<string, ContentId> = new Map();
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

	async create(
		modelInfo: ModelInfo,
		modelDefinition: Model,
		content: any,
		parentId: ContentId = this.rootContentId
	): Promise<Content> {
		const id = generateId(
			modelInfo.type ? modelInfo.type.slice(0, 3).toUpperCase() : ''
		) as ContentId;
		const newContent: Content = { id, modelInfo, modelDefinition, content };
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
			const parentNode = this.tree.parent(id as string);
			const path = this.getPathForContent(id);
			await this.set(updatedContent, parentNode?.id as ContentId, path);
			return updatedContent;
		}
		return undefined;
	}

	async addCompositeContent(content: Content, parentId?: ContentId, path?: string): Promise<void> {
		await this.set(content, parentId, path);

		if (isCompositeContent(content) && Array.isArray(content.children)) {
			for (const childId of content.children) {
				const childContent = await this.get(childId);

				if (childContent) {
					const childPath = this.generatePath(path, childContent.modelInfo.key);
					await this.addCompositeContent(childContent, content.id, childPath);
				}
			}
		}
	}

	private generatePath(parentPath: string | undefined, key: string): string {
		return parentPath ? `${parentPath}.${key}` : key;
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
