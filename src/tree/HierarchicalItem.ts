export type HierarchicalItem<T> = T & {
  children: HierarchicalItem<T>[];
};
