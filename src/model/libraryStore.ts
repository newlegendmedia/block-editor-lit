import { ModelStore } from '../modelstore/ModelStore';
import { IndexedDBAdapter } from '../resourcestore/IndexedDBAdapter';
import { Model } from './model';
import { DEFAULT_SCHEMA_NAME } from '../modelstore/constants';

class LibraryStore {
  private subscribers: Set<(value: ModelStore, ready: boolean) => void> = new Set();
  private _modelStore: ModelStore;
  private _ready: boolean = false;

  constructor() {
    const storage = new IndexedDBAdapter<Model>('model-store', 1);
    this._modelStore = new ModelStore(storage);
    this.initializeLibrary();
  }

  private async initializeLibrary() {
    await this._modelStore.loadSchema(DEFAULT_SCHEMA_NAME);
    this._ready = true;
    this.notify();
  }

  get value(): ModelStore {
    return this._modelStore;
  }

  get ready(): boolean {
    return this._ready;
  }

  subscribe(callback: (value: ModelStore, ready: boolean) => void): () => void {
    this.subscribers.add(callback);
    callback(this._modelStore, this._ready);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notify() {
    for (const callback of this.subscribers) {
      callback(this._modelStore, this._ready);
    }
  }
}

export const libraryStore = new LibraryStore();

export type { ModelStore };