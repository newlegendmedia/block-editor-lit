import { Tree } from "./Tree";

export class TreeNode<K, Item> {
  private _children: TreeNode<K, Item>[];
  private _tree: Tree<K, Item> | null = null;

  constructor(
    private _id: K,
    private _item: Item,
    private _parentId: K | null = null,
    children?: TreeNode<K, Item>[],
    tree?: Tree<K, Item>,
  ) {
    this._children = children || [];
    this._tree = tree || null;
  }

  get id(): K {
    return this._id;
  }

  get item(): Item {
    return this._item;
  }

  set item(item: Item) {
    this._item = item;
  }

  get parentId(): K | null {
    return this._parentId;
  }

  set parentId(parentId: K | null) {
    this._parentId = parentId;
  }

  get children(): TreeNode<K, Item>[] {
    return this._children;
  }

  get tree(): Tree<K, Item> | null {
    return this._tree;
  }

  attachToTree(tree: Tree<K, Item>): void {
    this._tree = tree;
  }

  addChild(
    child: TreeNode<K, Item>,
    afterChildId?: K,
  ): TreeNode<K, Item> | undefined {
    // If the child has a parent, remove the child from its current parent

    if (child.parentId) {
      const currentParent = this.tree?.get(child.parentId);
      currentParent?.removeChild(child.id);
    }

    // Add the child to this node
    child.parentId = this.id;

    if (afterChildId) {
      const index = this.children.findIndex((node) => node.id === afterChildId);
      if (index === -1) return undefined;
      this.children.splice(index + 1, 0, child);
    } else {
      this.children.push(child);
    }
    this.tree?.addNodeToMap(child);
    return child;
  }

  removeChild(childId: K): void {
    const index = this.children.findIndex((node) => node.id === childId);
    if (index === -1) return;
    this.children.splice(index, 1);
    this.tree?.removeNodeFromMap(childId);
  }
}
