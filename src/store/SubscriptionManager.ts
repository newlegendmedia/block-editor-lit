// subscriptionManager.ts

// Import necessary types from content.ts
import { Content, ContentId } from '../content/content';

// Define subscriber types
type ContentSubscriber = (content: Content | undefined ) => void;
type GlobalSubscriber = () => void;

export class SubscriptionManager {
  private contentSubscriptions: Map<ContentId, Set<ContentSubscriber>> = new Map();
  private globalSubscribers: Set<GlobalSubscriber> = new Set();

  /**
   * Subscribe to changes for a specific content item.
   * @param id The ID of the content to subscribe to
   * @param callback Function to be called when the content changes
   * @returns A function to unsubscribe
   */
  subscribeToContent(id: ContentId, callback: ContentSubscriber): () => void {
    if (!this.contentSubscriptions.has(id)) {
      this.contentSubscriptions.set(id, new Set());
    }
    this.contentSubscriptions.get(id)!.add(callback);
    return () => {
      const subscribers = this.contentSubscriptions.get(id);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.contentSubscriptions.delete(id);
        }
      }
    };
  }

  /**
   * Subscribe to all content changes.
   * @param callback Function to be called when any content changes
   * @returns A function to unsubscribe
   */
  subscribeToAllContent(callback: GlobalSubscriber): () => void {
    this.globalSubscribers.add(callback);
    return () => this.globalSubscribers.delete(callback);
  }

  /**
   * Notify subscribers about a content change.
   * @param id The ID of the changed content
   * @param content The new content state, or null if deleted
   */
  notifyContentChange(id: ContentId, content: Content | undefined): void {
    queueMicrotask(() => {
      // Notify content-specific subscribers
      this.contentSubscriptions.get(id)?.forEach(callback => {
        try {
          callback(content);
        } catch (error) {
          console.error('Error in content subscriber:', error);
        }
      });

      // Notify global subscribers
      this.globalSubscribers.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Error in global subscriber:', error);
        }
      });
    });
  }

  /**
   * Get the number of subscribers for a specific content item.
   * @param id The ID of the content
   * @returns The number of subscribers
   */
  getSubscriberCount(id: ContentId): number {
    return this.contentSubscriptions.get(id)?.size ?? 0;
  }

  /**
   * Get the number of global subscribers.
   * @returns The number of global subscribers
   */
  getGlobalSubscriberCount(): number {
    return this.globalSubscribers.size;
  }

  /**
   * Clear all subscriptions.
   */
  clearAllSubscriptions(): void {
    this.contentSubscriptions.clear();
    this.globalSubscribers.clear();
  }
}