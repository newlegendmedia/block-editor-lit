import { Tree } from "../tree/Tree";
import { Resource } from "./Resource";
import { StorageAdapter } from '../storage/StorageAdapter';
import { SubscriptionManager } from "./SubscriptionManager";
import { deepClone } from '../util/deepClone';

export class ResourceStore<K, T extends Resource<K>> {
	protected tree: Tree<K, T>;
	protected storage: StorageAdapter<K, T>;
	protected subscriptions: SubscriptionManager<K, T>;

	constructor(storage: StorageAdapter<K, T>, rootId: K, rootItem: T) {
		this.storage = storage;
		this.tree = new Tree<K, T>(rootId, rootItem);
		this.subscriptions = new SubscriptionManager<K, T>();
	}

	async get(id: K): Promise<T | undefined> {
		let item = this.tree.get(id)?.item;

		if (!item) {
			item = await this.storage.get(id);

			if (item) {
				this.tree.add(item, item.parentId as K | undefined, item.id);
			}
		}

		return item ? deepClone(item) : undefined;
	}

	async set(item: T, parentId?: K): Promise<void> {
		// const existingItem = await this.get(item.id as K);

		// if (existingItem) {
		// 	item = { ...existingItem, ...item };
		// }

		await this.storage.set(item);

		const node = this.tree.add(item, parentId, item.id as K);

		if (!node) {
			console.error(`Failed to add/update item ${item.id} in the tree.`);
		}

		this.subscriptions.notify(item.id as K, deepClone(item));
		this.subscriptions.notifyAll();
	}

	async delete(id: K): Promise<void> {
		await this.storage.delete(id);
		this.tree.remove(id);
		this.subscriptions.notify(id, null);
		this.subscriptions.notifyAll();
	}

	async getAll(): Promise<T[]> {
		return deepClone(this.tree.getAll());
	}

	async getMany(ids: K[]): Promise<(T | undefined)[]> {
		const items = await Promise.all(ids.map((id) => this.get(id)));
		return items.map((item) => (item ? deepClone(item) : undefined));
	}

	async setMany(items: T[]): Promise<void> {
		await Promise.all(items.map((item) => this.set(item)));
	}

	async deleteMany(ids: K[]): Promise<void> {
		await Promise.all(ids.map((id) => this.delete(id)));
	}

	async exists(id: K): Promise<boolean> {
		const item = await this.get(id);
		return item !== undefined;
	}

	async clear(): Promise<void> {
		await this.storage.clear();
		this.tree = new Tree<K, T>(this.tree.getRootId(), this.tree.get(this.tree.getRootId())!.item);
		this.subscriptions.notifyAll();
	}

	subscribe(id: K, callback: (item: T | null) => void): void {
		this.subscriptions.subscribe(id, callback);
	}

	unsubscribe(id: K, callback: (item: T | null) => void): void {
		this.subscriptions.unsubscribe(id, callback);
	}

	subscribeToAll(callback: () => void): () => void {
		return this.subscriptions.subscribeToAll(callback);
	}

	unsubscribeFromAll(callback: () => void): void {
		this.subscriptions.unsubscribeFromAll(callback);
	}

	protected getStorage(): StorageAdapter<K, T> {
		return this.storage;
	}

	protected getParentId(_item: T): K | undefined {
		return undefined;
	}

	async getSubtree(id: K): Promise<T | null> {
		const subtreeNode = this.tree.getSubtree(id);
		if (!subtreeNode) {
			return null;
		}

		const getSubtreeHelper = async (node: T): Promise<T> => {
			const clonedNode = deepClone(node);
			const children = await Promise.all(
				this.tree.get(node.id as K)!.children.map((child) => getSubtreeHelper(child.item))
			);
			(clonedNode as any).children = children;
			return clonedNode;
		};

		return getSubtreeHelper(subtreeNode.item);
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