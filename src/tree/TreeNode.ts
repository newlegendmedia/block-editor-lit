// // TreeNode.ts

// export class TreeNode<K, Item> {
// 	public id: K;
// 	public item: Item;
// 	public parentId: K | null;
// 	public children: TreeNode<K, Item>[];

// 	constructor(id: K, item: Item, parentId: K | null = null, children: TreeNode<K, Item>[] = []) {
// 		this.id = id;
// 		this.item = item;
// 		this.parentId = parentId;
// 		this.children = children;
// 	}
// }

export type NodeId = string;
export type Path = number[];

export interface TreeNode {
	id: NodeId;
	parentId: NodeId | null;
	children: NodeId[];
}

export type ResolvedNode<T extends TreeNode> = Omit<T, 'children'> & {
	children: Array<ResolvedNode<T>>;
};
