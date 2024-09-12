// modelStoreInstance.ts

import { ModelStore } from "./ModelStore";
import { IndexedDBAdapter } from "../resourcestore/IndexedDBAdapter";
import { Model } from "../model/model";

// Create a singleton instance of IndexedDBAdapter for ModelStore
const modelStorageAdapter = new IndexedDBAdapter<Model>("model-store", 1);

// Create a singleton instance of ModelStore
export const modelStore = new ModelStore(modelStorageAdapter);

// Export types for use in other files
export type { ModelStore };
export type { Model } from "../model/model";
