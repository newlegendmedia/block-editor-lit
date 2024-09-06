export class SubscriptionManager<K, T> {
  private subscribers: Map<K, Set<(item: T | null) => void>> = new Map();
  private globalSubscribers: Set<() => void> = new Set();

  subscribe(id: K, callback: (item: T | null) => void): () => void {
    if (!this.subscribers.has(id)) {
      this.subscribers.set(id, new Set());
    }
    this.subscribers.get(id)!.add(callback);
    return () => this.unsubscribe(id, callback);
  }

  unsubscribe(id: K, callback: (item: T | null) => void): void {
    this.subscribers.get(id)?.delete(callback);
  }

  subscribeToAll(callback: () => void): () => void {
    this.globalSubscribers.add(callback);
    return () => this.unsubscribeFromAll(callback);
  }

  unsubscribeFromAll(callback: () => void): void {
    this.globalSubscribers.delete(callback);
  }

  notify(id: K, item: T | null): void {
    this.subscribers.get(id)?.forEach(callback => callback(item));
  }

  notifyAll(): void {
    this.globalSubscribers.forEach(callback => callback());
  }
}