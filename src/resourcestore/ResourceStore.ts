import { Tree } from '../tree/Tree';
import { Resource } from './Resource';
import { StorageAdapter } from './StorageAdapter';
import { SubscriptionManager } from './SubscriptionManager';

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
    return item;
  }
  
  async set(item: T, parentId?: K): Promise<void> {
    const existingItem = await this.get(item.id as K);
    if (existingItem) {
      item = { ...existingItem, ...item };
    }

    await this.storage.set(item);
    
    // Use the improved Tree.add method
    const node = this.tree.add(item, parentId, item.id as K);
    if (!node) {
      console.error(`Failed to add/update item ${item.id} in the tree.`);
    }

    this.subscriptions.notify(item.id as K, item);
    this.subscriptions.notifyAll();
  }
  
  async delete(id: K): Promise<void> {
    await this.storage.delete(id as string);
    this.tree.remove(id);
    this.subscriptions.notify(id, null);
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

  // Additional utility methods

  protected getStorage(): StorageAdapter<T> {
    return this.storage;
  }

  // Method to get all resources
  async getAll(): Promise<T[]> {
    return this.tree.getAll();
  }

  async getMany(ids: K[]): Promise<(T | undefined)[]> {
    return Promise.all(ids.map(id => this.get(id)));
  }

  async setMany(items: T[]): Promise<void> {
    await Promise.all(items.map(item => this.set(item)));
  }

  async deleteMany(ids: K[]): Promise<void> {
    await Promise.all(ids.map(id => this.delete(id)));
  }

  // Method to check if a resource exists
  async exists(id: K): Promise<boolean> {
    const item = await this.get(id);
    return item !== null;
  }

  // Method to clear all resources
  async clear(): Promise<void> {
    await this.storage.clear();
    this.tree = new Tree<K, T>(this.tree.getRootId(), this.tree.get(this.tree.getRootId())!.item);
    this.subscriptions.notifyAll();
  }

  protected getParentId(_item: T): K | undefined {
    // This method should be implemented based on how you determine the parent ID
    // It might be a property of the item, or you might need to look it up elsewhere
    // For now, we'll return undefined
    return undefined;
  }
}