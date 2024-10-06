// HierarchicalItem.ts
import { ResolvedNode, TreeNode } from './TreeNode';

export type HierarchicalItem<T extends TreeNode> = ResolvedNode<T> & {
	children: HierarchicalItem<T>[];
};
