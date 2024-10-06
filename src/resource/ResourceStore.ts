import { Tree } from '../tree/Tree';
import { Resource } from './Resource';
import { StorageAdapter } from '../storage/StorageAdapter';
import { SubscriptionManager } from './SubscriptionManager';
import { deepClone } from '../util/deepClone';
import { ResolvedNode } from '../tree/TreeNode';

type ResourceId = string;

export class ResourceStore<T extends Resource> {
	protected tree: Tree<T>;
	protected storage: StorageAdapter<ResourceId, T>;
	protected subscriptions: SubscriptionManager<ResourceId, T>;

	constructor(storage: StorageAdapter<ResourceId, T>, _rootId: ResourceId, rootItem: T) {
		this.storage = storage;
		this.tree = new Tree<T>(rootItem);
		this.subscriptions = new SubscriptionManager<ResourceId, T>();
	}

	async get(id: ResourceId): Promise<T | undefined> {
		let item = this.tree.getById(id);

		if (!item) {
			item = await this.storage.get(id);

			if (item) {
				this.tree.add(item);
			}
		}

		return item ? deepClone(item) : undefined;
	}

	async set(item: T, parentId?: ResourceId): Promise<void> {
		await this.storage.set(item);

		const node = this.tree.add(item, parentId, item.id);

		if (!node) {
			console.error(`Failed to add/update item ${item.id} in the tree.`);
		}

		this.subscriptions.notify(item.id, deepClone(item));
		this.subscriptions.notifyAll();
	}

	async delete(id: ResourceId): Promise<void> {
		await this.storage.delete(id);
		this.tree.remove(id);
		this.subscriptions.notify(id, null);
		this.subscriptions.notifyAll();
	}

	async getAll(): Promise<T[]> {
		const all = deepClone(this.tree.getAll());
		return all;
	}

	async getMany(ids: ResourceId[]): Promise<(T | undefined)[]> {
		const items = await Promise.all(ids.map((id) => this.get(id)));
		return items.map((item) => (item ? deepClone(item) : undefined));
	}

	async setMany(items: T[]): Promise<void> {
		await Promise.all(items.map((item) => this.set(item)));
	}

	async deleteMany(ids: ResourceId[]): Promise<void> {
		await Promise.all(ids.map((id) => this.delete(id)));
	}

	async exists(id: ResourceId): Promise<boolean> {
		const item = await this.get(id);
		return item !== undefined;
	}

	async clear(): Promise<void> {
		await this.storage.clear();
		const root: Resource = {
			id: 'root',
			type: 'root',
			key: 'root',
			content: null,
			parentId: null,
			children: [],
		};
		this.tree = new Tree<T>(root as T);
		this.subscriptions.notifyAll();
	}

	subscribe(id: ResourceId, callback: (item: T | null) => void): void {
		this.subscriptions.subscribe(id, callback);
	}

	unsubscribe(id: ResourceId, callback: (item: T | null) => void): void {
		this.subscriptions.unsubscribe(id, callback);
	}

	subscribeToAll(callback: () => void): () => void {
		return this.subscriptions.subscribeToAll(callback);
	}

	unsubscribeFromAll(callback: () => void): void {
		this.subscriptions.unsubscribeFromAll(callback);
	}

	protected getStorage(): StorageAdapter<ResourceId, T> {
		return this.storage;
	}

	protected getParentId(_item: T): ResourceId | undefined {
		return undefined;
	}

	async getSubtree(id: ResourceId): Promise<ResolvedNode<T> | null> {
		const subtreeNode = this.tree.getResolved(id);
		if (!subtreeNode) {
			return null;
		}

		// const getSubtreeHelper = async (node: T): Promise<T> => {
		// 	const clonedNode = deepClone(node);
		// 	const children = await Promise.all(
		// 		this.tree.get(node.id)!.children.map((child) => getSubtreeHelper(child))
		// 	);
		// 	(clonedNode as any).children = children;
		// 	return clonedNode;
		// };

		//return getSubtreeHelper(subtreeNode);
		return subtreeNode;
	}

	// async duplicateSubtree(id: K, parentId: K): Promise<T | null> {
	// 	const duplicatedNode = this.tree.duplicateSubtree(id, parentId);
	// 	if (!duplicatedNode) {
	// 		return null;
	// 	}

	// 	const updateStorageHelper = async (node: T): Promise<void> => {
	// 		await this.storage.set(node);
	// 		if ((node as any).children) {
	// 			await Promise.all((node as any).children.map((child: T) => updateStorageHelper(child)));
	// 		}
	// 	};

	// 	await updateStorageHelper(duplicatedNode.item);

	// 	this.subscriptions.notifyAll();
	// 	return duplicatedNode.item;
	// }

	// async moveSubtree(id: K, newParentId: K): Promise<boolean> {
	// 	const success = this.tree.moveSubtree(id, newParentId);
	// 	if (success) {
	// 		const movedNode = this.tree.get(id);
	// 		if (movedNode) {
	// 			await this.storage.set(movedNode.item);
	// 			this.subscriptions.notifyAll();
	// 		}
	// 	}
	// 	return success;
	// }
}
