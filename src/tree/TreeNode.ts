// TreeNode.ts

export class TreeNode<K, Item> {
	public id: K;
	public item: Item;
	public parentId: K | null;
	public children: TreeNode<K, Item>[];

	constructor(id: K, item: Item, parentId: K | null = null, children: TreeNode<K, Item>[] = []) {
		this.id = id;
		this.item = item;
		this.parentId = parentId;
		this.children = children;
	}
}
