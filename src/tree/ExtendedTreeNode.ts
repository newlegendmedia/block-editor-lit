import { TreeNode } from './TreeNode';
import { BaseBlock } from '../blocks/BaseBlock';

export class ExtendedTreeNode<K, Item> extends TreeNode<K, Item> {
  block?: BaseBlock;

  constructor(
    id: K,
    item: Item,
    parentId: K | null = null,
    children: ExtendedTreeNode<K, Item>[] = [],
    block?: BaseBlock
  ) {
    super(id, item, parentId, children);
    this.block = block;
  }
}