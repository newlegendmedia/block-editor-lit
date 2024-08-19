// libraryStore.ts

import { UnifiedLibrary } from './ModelLibrary';

class LibraryStore {
  private subscribers: Set<(value: UnifiedLibrary, ready: boolean) => void> = new Set();
  private _library: UnifiedLibrary;
  private _ready: boolean = false;

  constructor() {
    this._library = new UnifiedLibrary();
    this.initializeLibrary();
  }

  private async initializeLibrary() {
    // Simulate async loading (replace with actual async operations if needed)
    await new Promise(resolve => setTimeout(resolve, 1000));
    this._ready = true;
    this.notify();
  }

  get value(): UnifiedLibrary {
    return this._library;
  }

  get ready(): boolean {
    return this._ready;
  }

  subscribe(callback: (value: UnifiedLibrary, ready: boolean) => void): () => void {
    this.subscribers.add(callback);
    callback(this._library, this._ready);
    return () => this.subscribers.delete(callback);
  }

  private notify() {
    for (const callback of this.subscribers) {
      callback(this._library, this._ready);
    }
  }
}

export const libraryStore = new LibraryStore();

export type { UnifiedLibrary };