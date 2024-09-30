import { Resource } from '../resource/Resource';

export interface StorageAdapter<K, T extends Resource<K>> {
	get(id: K): Promise<T | undefined>;
	set(item: T): Promise<void>;
	delete(id: K): Promise<void>;
	clear(): Promise<void>;
	getAll(): Promise<T[]>;
	getMany(ids: K[]): Promise<(T | undefined)[]>;
}
