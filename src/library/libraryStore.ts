import { UnifiedLibrary } from './ModelLibrary';

class Store<T> {
  private subscribers: Set<(value: T) => void> = new Set();
  private _value: T;

  constructor(initialValue: T) {
    this._value = initialValue;
  }

  get value(): T {
    return this._value;
  }

  set value(newValue: T) {
    this._value = newValue;
    this.notify();
  }

  subscribe(callback: (value: T) => void): () => void {
    this.subscribers.add(callback);
    callback(this._value);
    return () => this.subscribers.delete(callback);
  }

  private notify() {
    for (const callback of this.subscribers) {
      callback(this._value);
    }
  }
}

export const libraryStore = new Store(new UnifiedLibrary());

export type { UnifiedLibrary };