// export type HierarchicalItem<T> = T & {
// 	id: string | number;
// 	children: HierarchicalItem<T>[];
// };

import { ContentReference } from '../content/content';

export type HierarchicalItem<T> = T & {
	id: string;
	children: HierarchicalItem<T>[] | ContentReference[];
};
