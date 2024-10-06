import { ResourceStore } from '../resource/ResourceStore';
import { Content, ContentId } from './content';
import { Model } from '../model/model';
import { StorageAdapter } from '../storage/StorageAdapter';
import { generateId } from '../util/generateId';
import { HierarchicalItem } from '../tree/HierarchicalItem';
import { IndexedDBAdapter } from '../storage/IndexedDBAdapter';
import { ContentPath } from './ContentPath';
import { ContentFactory } from './ContentFactory';

export class ContentStore extends ResourceStore<Content> {
	pathMap: Map<string, ContentId> = new Map();
	private rootContentId: ContentId = 'root' as ContentId;

	constructor(storageAdapter: StorageAdapter<string, Content>) {
		const rootContent: Content = {
			id: 'root' as ContentId,
			type: 'root',
			key: 'root',
			parentId: null,
			children: [],
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
				id: generateId(model.type ? model.type.slice(0, 3).toUpperCase() : '') as ContentId,
				...defaultContent,
			};
			const contentPath = new ContentPath(path);

			content = await this.add(content, contentPath.parentPath, path);
		}

		return content;
	}

	async set(content: Content, parentId?: ContentId): Promise<void> {
		super.set(content, parentId);
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
		const parentContentPath = new ContentPath(parentPath);
		let parentId: ContentId | undefined = this.pathMap.get(parentContentPath.toString());

		// If parentId is not found, check if this is a document root
		if (!parentId && parentContentPath.pathSegments.length === 1) {
			// This is likely a document root, so we'll create it without a parent
			parentId = undefined;
		} else if (!parentId) {
			throw new Error(`Parent content not found at path ${parentPath}`);
		}
		return await this.create2(content, parentId, path);
	}

	async create2(content: Content, parentId?: ContentId, path?: string): Promise<Content> {
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
		path?: string
	): Promise<void> {
		// If it's a ContentReference, resolve it to full Content
		// if (isContentReference(content)) {
		// 	return;
		// }

		await this.set(content, parentId);

		console.log('Adding content', content, this.tree);

		if (path) {
			const contentPath = new ContentPath(path);
			this.pathMap.set(contentPath.toString(), content.id);
		}

		// Add composite content children to the store if they arent already there
		// if (isCompositeContent(content) && content.children) {
		// 	console.log('Adding composite content', content);
		// 	const childrenEntries = Object.entries(content.children);
		// 	for (const [childKey, childRef] of childrenEntries) {
		// 		console.log('Adding composite content child', childRef);
		// 		if (isFullContent(childRef)) {
		// 			const childContent = await this.get(childRef.id);
		// 			if (!childContent) {
		// 				const childPath = path
		// 					? new ContentPath(path, childKey).toString()
		// 					: ContentPath.fromDocumentId(childRef.key).toString();

		// 				// Recursively add the child content
		// 				await this.addCompositeContent(childRef, content.id, childPath);
		// 			}
		// 		} else {
		// 			const childPath = path
		// 				? new ContentPath(path, childKey).toString()
		// 				: ContentPath.fromDocumentId(childKey).toString();

		// 			// Recursively add the child content
		// 			console.log('Adding not fullcontent', childRef, content.id, childPath);
		// 			await this.addCompositeContent(childRef, content.id, childPath);
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
		return await super.getAll();
	}

	async getAllHierarchical(): Promise<HierarchicalItem<Content>> {
		const result = this.tree.getAllHierarchical();
		return result;
	}

	async duplicateContent(_id: ContentId): Promise<Content | null> {
		// const node = this.tree.get(id);
		// if (!node) {
		// 	console.warn(`Node not found for ID ${id}`);
		// 	return null;
		// }

		// const parentId = node.parentId;
		// if (!parentId) {
		// 	console.warn(`Parent ID not found for ID ${id}`);
		// 	return null;
		// }
		// let parentPath = this.getPathForContent(parentId) as string;

		// const updateItemHelper = async (
		// 	node: TreeNode<ContentId, Content>,
		// 	parent: TreeNode<ContentId, Content>,
		// 	parentPath: string
		// ): Promise<Content> => {
		// 	// create a unique new item and ID
		// 	const newItem = deepClone(node.item);
		// 	newItem.id = generateId(newItem.type.slice(0, 3).toUpperCase()) as ContentId;

		// 	// create the new path based on the parent item type
		// 	let newPath: string;
		// 	if (isIndexedCompositeContent(parent.item)) {
		// 		newPath = new ContentPath(parentPath, newItem.id).toString();
		// 	} else {
		// 		newPath = new ContentPath(parentPath, newItem.key).toString();
		// 	}

		// 	// create the new content
		// 	const newContent = await this.add(newItem, parentPath, newPath);
		// 	this.pathMap.set(newPath, newItem.id);

		// 	if ((node as any).children) {
		// 		await Promise.all(
		// 			(node as any).children.map((child: TreeNode<ContentId, Content>) =>
		// 				updateItemHelper(child, node, newPath)
		// 			)
		// 		);
		// 	}
		// 	return newContent;
		// };

		// let parent = this.tree.get(parentId);
		// if (!parent) {
		// 	console.warn(`Parent node not found for ID ${parentId}`);
		// 	return null;
		// }
		// const duplicateContent = await updateItemHelper(node, parent, parentPath);

		// this.subscriptions.notifyAll();

		return null;
	}

	// async duplicateContentSubtree(id: ContentId, parentId: ContentId): Promise<Content | null> {
	// 	let parentPath = this.getPathForContent(parentId);
	// 	if (!parentPath) {
	// 		console.warn(`Parent path not found for ID ${parentId}`);
	// 		return null;
	// 	}

	// 	const duplicatedNode = this.tree.duplicateSubtree(id, parentId);
	// 	if (!duplicatedNode) {
	// 		return null;
	// 	}

	// 	const updateItemHelper = async (
	// 		node: TreeNode<ContentId, Content>,
	// 		parent: TreeNode<ContentId, Content>,
	// 		parentPath: string
	// 	): Promise<void> => {
	// 		node.item.id = node.id;
	// 		let newPath: string;
	// 		if (isIndexedCompositeContent(parent.item)) {
	// 			newPath = new ContentPath(parentPath, node.id).toString();
	// 		} else {
	// 			newPath = new ContentPath(parentPath, node.item.key).toString();
	// 		}
	// 		this.pathMap.set(newPath, node.id);
	// 		if ((node as any).children) {
	// 			await Promise.all(
	// 				(node as any).children.map((child: TreeNode<ContentId, Content>) =>
	// 					updateItemHelper(child, node, newPath)
	// 				)
	// 			);
	// 		}
	// 	};

	// 	let parent = this.tree.get(parentId);
	// 	if (!parent) {
	// 		console.warn(`Parent node not found for ID ${parentId}`);
	// 		return null;
	// 	}
	// 	await updateItemHelper(duplicatedNode, parent, parentPath);

	// 	this.subscriptions.notifyAll();
	// 	return duplicatedNode.item;
	// }

	subscribeAll(callback: () => void): () => void {
		return super.subscribeToAll(callback);
	}

	getPathForContent(id: ContentId): string | undefined {
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
