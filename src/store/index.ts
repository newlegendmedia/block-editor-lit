//import { ContentStore } from './XXContentStore.ts';
import { IndexedDBAdapter } from "./IndexedDBAdapter.ts";

// Create a singleton instance of IndexedDBAdapter
export const storageAdapter = new IndexedDBAdapter();

// Create a singleton instance of ContentStore
//export const contentStore = new ContentStore(storageAdapter);

// Create a singleton instance of DocumentManager
export { documentManager } from "./DocumentManager";

// Export the types for use in other files
// export type { ContentStore } from './ContentStore';
// export type { Document, Content, ContentId, DocumentId } from '../content/content';
