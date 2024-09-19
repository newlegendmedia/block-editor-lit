import { Tree } from "../tree/Tree";
import { Resource } from "./Resource";
import { StorageAdapter } from '../storage/StorageAdapter';
import { SubscriptionManager } from "./SubscriptionManager";
import { deepClone } from '../util/deepClone';

export class ResourceStore<K, T extends Resource> {
	protected tree: Tree<K, T>;
	private storage: StorageAdapter<T>;
	protected subscriptions: SubscriptionManager<K, T>;

	constructor(storage: StorageAdapter<T>, rootId: K, rootItem: T) {
		this.storage = storage;
		this.tree = new Tree<K, T>(rootId, rootItem);
		this.subscriptions = new SubscriptionManager<K, T>();
	}

	async get(id: K): Promise<T | undefined> {
		let item = this.tree.get(id)?.item;

		if (!item) {
			item = await this.storage.get(id as string);

			if (item) {
				this.tree.add(item, item.parentId as K | undefined, item.id as K);
			}
		}

		return item ? deepClone(item) : undefined;
	}

	async set(item: T, parentId?: K): Promise<void> {
		const existingItem = await this.get(item.id as K);

		if (existingItem) {
			item = { ...existingItem, ...item };
		}

		await this.storage.set(item);

		const node = this.tree.add(item, parentId, item.id as K);

		if (!node) {
			console.error(`Failed to add/update item ${item.id} in the tree.`);
		}

		this.subscriptions.notify(item.id as K, deepClone(item));
		this.subscriptions.notifyAll();
	}

	async delete(id: K): Promise<void> {
		await this.storage.delete(id as string);
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

	protected getStorage(): StorageAdapter<T> {
		return this.storage;
	}

	protected getParentId(_item: T): K | undefined {
		return undefined;
	}
}
