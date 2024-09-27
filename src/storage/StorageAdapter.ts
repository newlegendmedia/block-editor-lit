import { Resource } from '../resource/Resource';

export interface StorageAdapter<T extends Resource> {
	get(id: string): Promise<T | undefined>;
	set(item: T): Promise<void>;
	delete(id: string): Promise<void>;
	clear(): Promise<void>;
	getAll(): Promise<T[]>;
	getMany(ids: string[]): Promise<(T | undefined)[]>;
}
