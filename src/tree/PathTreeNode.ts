import { TreeNode } from './TreeNode';
import { BaseBlock } from '../blocks/BaseBlock';

export class PathTreeNode<K, Item> extends TreeNode<K, Item> {
  block?: BaseBlock;

  constructor(
    id: K,
    item: Item,
    parentId: K | null = null,
    children: PathTreeNode<K, Item>[] = [],
  ) {
    super(id, item, parentId, children);
  }
}