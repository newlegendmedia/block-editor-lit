export class MappedArray<K extends string, T extends Record<K, string>> implements Iterable<T> {
	private items: T[] = [];
	private itemMap: Map<T[K], T> = new Map();
	private readonly keyProp: K;

	constructor(keyProp: K) {
		this.keyProp = keyProp;
	}

	add(item: T): void {
		this.items.push(item);
		this.itemMap.set(item[this.keyProp], item);
	}

	get(key: T[K] | number): T | undefined {
		if (typeof key === 'number') {
			return this.getByIndex(key);
		} else {
			return this.getByKey(key);
		}
	}

	getByKey(key: T[K]): T | undefined {
		return this.itemMap.get(key);
	}

	getByIndex(index: number): T | undefined {
		return this.items[index];
	}

	set(key: T[K] | number, item: T): void {
		if (typeof key === 'number') {
			this.setByIndex(key, item);
		} else {
			this.setByKey(key, item);
		}
	}

	setByKey(key: T[K], item: T): void {
		const index = this.items.findIndex((i) => i[this.keyProp] === key);
		if (index !== -1) {
			this.items[index] = item;
		} else {
			this.items.push(item);
		}
		this.itemMap.set(key, item);
	}

	setByIndex(index: number, item: T): void {
		if (index >= 0 && index < this.items.length) {
			const oldItem = this.items[index];
			this.itemMap.delete(oldItem[this.keyProp]);
			this.items[index] = item;
			this.itemMap.set(item[this.keyProp], item);
		} else if (index === this.items.length) {
			this.add(item);
		} else {
			throw new Error('Index out of bounds');
		}
	}

	remove(key: T[K]): boolean {
		const index = this.items.findIndex((item) => item[this.keyProp] === key);
		if (index !== -1) {
			this.items.splice(index, 1);
			this.itemMap.delete(key);
			return true;
		}
		return false;
	}

	get count(): number {
		return this.items.length;
	}

	*[Symbol.iterator](): Iterator<T> {
		yield* this.items;
	}

	toArray(): T[] {
		return [...this.items];
	}

	toObject(): Record<string, T> {
		return Object.fromEntries(this.itemMap);
	}
}
