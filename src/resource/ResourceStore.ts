import { UniversalPath } from '../path/UniversalPath';
import { StorageAdapter } from '../storage/StorageAdapter';
import { HierarchicalItem } from '../tree/HierarchicalItem';
import { Tree } from '../tree/Tree';
import { deepClone } from '../util/deepClone';
import { generateId } from '../util/generateId';
import { Resource } from './Resource';
import { SubscriptionManager } from './SubscriptionManager';

type ResourceId = string;

export class ResourceStore<T extends Resource> {
	protected tree: Tree<T>;
	protected storage: StorageAdapter<ResourceId, T>;
	protected subscriptions: SubscriptionManager<ResourceId, T>;
	pathMap: Map<string, ResourceId> = new Map();

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

	async getByPath(path: string): Promise<T | undefined> {
		const id = this.pathMap.get(path);
		return id ? this.get(id) : undefined;
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

	async add(item: T, parentPath: string, path: string): Promise<T> {
		let parentId: ResourceId | undefined = this.pathMap.get(parentPath);
		if (!parentId && parentPath === 'root') {
			parentId = 'root';
		}
		if (!parentId) {
			throw new Error(`Parent content not found at path ${parentPath.toString()}`);
		}

		await this.create(item, parentId, path);

		return item;
	}

	async create(item: T, parentId: ResourceId, path?: string): Promise<T> {
		if (!item.id) {
			item.id = generateId(item.type ? item.type.slice(0, 3).toUpperCase() : '');
		}

		await this.set(item, parentId);

		console.log('Set pathmap:', item, parentId, path);

		if (path) {
			this.pathMap.set(path, item.id);
		}

		return item;
	}

	async remove(id: ResourceId): Promise<void> {
		const path = this.getPathForId(id);
		if (!path) {
			return;
		}
		this.pathMap.delete(path.toString());
		this.tree.remove(id);
		await this.storage.delete(id);

		this.subscriptions.notify(id, null);
		this.subscriptions.notifyAll();
	}

	async update(id: ResourceId, updater: (content: T) => T): Promise<T | undefined> {
		const item = await this.get(id);

		if (item) {
			const updatedItem = updater(item);
			const parentNode = this.tree.parent(item);
			await this.set(updatedItem, parentNode?.id);
			return updatedItem;
		}
		return undefined;
	}

	async duplicateItem(id: ResourceId): Promise<T | undefined> {
		const original = await this.get(id);
		if (!original) {
			return;
		}
		if (!original.parentId) {
			original.parentId = 'root';
		}

		const parentPath = this.getPathForId(original.parentId);
		if (!parentPath) {
			throw new Error(`Parent path not found for content ${id}`);
		}

		const duplicate = JSON.parse(JSON.stringify(original));
		duplicate.id = generateId(duplicate.type.slice(0, 3).toUpperCase());

		const newPath = UniversalPath.fromFullPath(parentPath.toString(), duplicate.key, duplicate.id);

		return this.create(duplicate, original.parentId, newPath.toString());
	}

	async getAll(): Promise<T[]> {
		const all = deepClone(this.tree.getAll());
		return all;
	}

	async getAllHierarchical(): Promise<HierarchicalItem<T>> {
		return this.tree.getAllHierarchical();
	}

	async clear(): Promise<void> {
		await this.storage.clear();
		const root: Resource = {
			id: 'root',
			type: 'root',
			key: 'root',
			parentId: null,
			children: [],
		};
		this.pathMap.clear();
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

	protected async getParentId(item: T): Promise<ResourceId | undefined> {
		const node = await this.get(item.id);
		return node?.parentId as ResourceId | undefined;
	}

	getPathForId(id: ResourceId): string | undefined {
		for (const [pathString, contentId] of this.pathMap.entries()) {
			if (contentId === id) {
				return pathString;
			}
		}
		return undefined;
	}
}
