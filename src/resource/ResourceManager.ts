// src/ResourceManager.ts

import { Resource } from './Resource';
import { ResourceStore } from './ResourceStore';
import { StorageAdapter } from './StorageAdpater';
import { ResourceTree } from './ResourceTree';

export class ResourceManager<T extends Resource> {
  protected store: ResourceStore<T>;
  protected storageAdapter: StorageAdapter<T>;
  protected tree: ResourceTree<T>;

  constructor(storageAdapter: StorageAdapter<T>, rootItem: T) {
    this.store = new ResourceStore<T>();
    this.storageAdapter = storageAdapter;
    this.tree = new ResourceTree<T>(rootItem);
  }

  async get(id: string): Promise<T | undefined> {
    let item = await this.store.get(id);
    if (!item) {
      item = await this.storageAdapter.load(id);
      if (item) {
        await this.store.set(item);
      }
    }
    return item;
  }

  async set(item: T, parentId?: string): Promise<void> {
    await this.store.set(item);
    await this.storageAdapter.save(item);
    if (parentId) {
      this.tree.addNode(item, parentId);
    }
  }

  async delete(id: string): Promise<void> {
    await this.store.delete(id);
    await this.storageAdapter.delete(id);
    this.tree.removeNode(id);
  }

  subscribe(id: string, callback: (item: T | null) => void): () => void {
    return this.store.subscribe(id, callback);
  }

  getTree(): ResourceTree<T> {
    return this.tree;
  }
}