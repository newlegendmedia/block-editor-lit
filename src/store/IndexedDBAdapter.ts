// indexedDBAdapter.ts
import { StorageAdapter } from "./StorageAdapter";
import { Content, ContentId } from "../content/content";

export class IndexedDBAdapter implements StorageAdapter {
  private dbName: string;
  private dbVersion: number;
  private contentStoreName: string;

  constructor(
    dbName: string = "ContentStore",
    dbVersion: number = 1,
    contentStoreName: string = "content",
  ) {
    this.dbName = dbName;
    this.dbVersion = dbVersion;
    this.contentStoreName = contentStoreName;
  }

  private async openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        db.createObjectStore(this.contentStoreName, { keyPath: "id" });
      };
    });
  }

  private async performTransaction<T>(
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T> | IDBRequest<T>[],
  ): Promise<T | T[]> {
    const db = await this.openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.contentStoreName, mode);
      const store = transaction.objectStore(this.contentStoreName);
      const request = operation(store);

      transaction.oncomplete = () => {
        db.close();
        if (Array.isArray(request)) {
          resolve(request.map((r) => r.result));
        } else {
          resolve(request.result);
        }
      };
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async saveContent(content: Content): Promise<void> {
    try {
      const serializedContent = JSON.stringify(content);
      await this.performTransaction("readwrite", (store) => {
        return store.put({ id: content.id, data: serializedContent });
      });
    } catch (error) {
      console.error("Error saving content:", error);
      throw error;
    }
  }

  async loadContent(id: ContentId): Promise<Content | undefined> {
    try {
      const result = await this.performTransaction("readonly", (store) =>
        store.get(id),
      );

      if (result && result.data) {
        return JSON.parse(result.data) as Content;
      }
      return undefined;
    } catch (error) {
      console.error("Error loading content:", error);
      return undefined;
    }
  }

  async deleteContent(id: ContentId): Promise<void> {
    try {
      await this.performTransaction("readwrite", (store) => store.delete(id));
    } catch (error) {
      console.error("Error deleting content:", error);
      throw error;
    }
  }

  async batchSaveContent(contents: Content[]): Promise<void> {
    try {
      await this.performTransaction("readwrite", (store) =>
        contents.map((content) => store.put(content)),
      );
    } catch (error) {
      console.error("Error batch saving content:", error);
      throw error;
    }
  }

  async batchDeleteContent(ids: ContentId[]): Promise<void> {
    try {
      await this.performTransaction("readwrite", (store) =>
        ids.map((id) => store.delete(id)),
      );
    } catch (error) {
      console.error("Error batch deleting content:", error);
      throw error;
    }
  }

  async clearAllData(): Promise<void> {
    try {
      await this.performTransaction("readwrite", (store) => store.clear());
    } catch (error) {
      console.error("Error clearing all data:", error);
      throw error;
    }
  }
}
