import { StorageAdapter } from './StorageAdapter';
import { Resource } from '../resource/Resource';

export class IndexedDBAdapter<T extends Resource<string>> implements StorageAdapter<T> {
	private dbName: string;
	private dbVersion: number;
	private storeName: string;

	constructor(dbName: string, dbVersion: number, storeName: string = 'resources') {
		this.dbName = dbName;
		this.dbVersion = dbVersion;
		this.storeName = storeName;
	}

	private async openDB(): Promise<IDBDatabase> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(this.dbName, this.dbVersion);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result);

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;
				db.createObjectStore(this.storeName, { keyPath: 'id' });
			};
		});
	}

	async get(id: string): Promise<T | undefined> {
		const db = await this.openDB();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(this.storeName, 'readonly');
			const store = transaction.objectStore(this.storeName);
			const request = store.get(id);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result || null);
		});
	}

	async set(item: T): Promise<void> {
		const db = await this.openDB();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(this.storeName, 'readwrite');
			const store = transaction.objectStore(this.storeName);
			const request = store.put(item);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve();
		});
	}

	async delete(id: string): Promise<void> {
		const db = await this.openDB();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(this.storeName, 'readwrite');
			const store = transaction.objectStore(this.storeName);
			const request = store.delete(id);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve();
		});
	}

	async getAll(): Promise<T[]> {
		const db = await this.openDB();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(this.storeName, 'readonly');
			const store = transaction.objectStore(this.storeName);
			const request = store.getAll();

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result);
		});
	}

	async clear(): Promise<void> {
		const db = await this.openDB();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(this.storeName, 'readwrite');
			const store = transaction.objectStore(this.storeName);
			const request = store.clear();

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve();
		});
	}

	// Additional methods for batch operations

	async getMany(ids: string[]): Promise<(T | undefined)[]> {
		//    const db = await this.openDB();
		return Promise.all(ids.map((id) => this.get(id)));
	}

	async setMany(items: T[]): Promise<void> {
		const db = await this.openDB();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(this.storeName, 'readwrite');
			const store = transaction.objectStore(this.storeName);

			items.forEach((item) => store.put(item));

			transaction.oncomplete = () => resolve();
			transaction.onerror = () => reject(transaction.error);
		});
	}

	async deleteMany(ids: string[]): Promise<void> {
		const db = await this.openDB();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(this.storeName, 'readwrite');
			const store = transaction.objectStore(this.storeName);

			ids.forEach((id) => store.delete(id));

			transaction.oncomplete = () => resolve();
			transaction.onerror = () => reject(transaction.error);
		});
	}
}
