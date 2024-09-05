// src/store/StorageAdapter.ts

import { Resource } from './Resource';

export interface StorageAdapter<T extends Resource> {
  load(id: string): Promise<T | undefined>;
  save(item: T): Promise<void>;
  delete(id: string): Promise<void>;
  batchSave(items: T[]): Promise<void>;
  batchDelete(ids: string[]): Promise<void>;
  clearAll(): Promise<void>;
}