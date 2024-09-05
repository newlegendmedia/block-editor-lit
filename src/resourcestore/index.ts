import { ContentStore } from './ContentStore';
import { IndexedDBAdapter } from './IndexedDBAdapter';
import { Content } from '../content/content';

// Create a singleton instance of IndexedDBAdapter
const storageAdapter = new IndexedDBAdapter<Content>('content-store', 1);

// Create a singleton instance of ContentStore
export const contentStore = new ContentStore(storageAdapter);

// Export types for use in other files
export type { ContentStore };
export type { Content, ContentId } from '../content/content';