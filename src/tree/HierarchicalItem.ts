export type HierarchicalItem<T> = T & {
	id: string | number;
	children: HierarchicalItem<T>[];
};
