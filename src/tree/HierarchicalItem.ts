// HierarchicalItem.ts
export type HierarchicalItem<T> = T & {
	id: string;
	children: HierarchicalItem<T>[];
};
