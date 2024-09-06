// src/ResourceStore.ts

import { Resource } from './Resource';

export class ResourceStore<T extends Resource> {
  private items: Map<string, T> = new Map();
  private subscribers: Map<string, Set<(item: T | null) => void>> = new Map();

  async get(id: string): Promise<T | undefined> {
    console.log(`GET ITEMS ${id}`);
    return this.items.get(id);
  }

  async set(item: T): Promise<void> {
    console.log(`SET ITEMS ${item.id}`);
    this.items.set(item.id, item);
    this.notifySubscribers(item.id, item);
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
    this.notifySubscribers(id, null);
  }

  subscribe(id: string, callback: (item: T | null) => void): () => void {
    if (!this.subscribers.has(id)) {
      this.subscribers.set(id, new Set());
    }
    this.subscribers.get(id)!.add(callback);
    return () => {
      const subscribers = this.subscribers.get(id);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscribers.delete(id);
        }
      }
    };
  }

  private notifySubscribers(id: string, item: T | null): void {
    const subscribers = this.subscribers.get(id);
    if (subscribers) {
      subscribers.forEach(callback => callback(item));
    }
  }
}