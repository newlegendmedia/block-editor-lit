// src/ResourceTree.ts

import { Resource } from './Resource';

export class ResourceTreeNode<T extends Resource> {
  constructor(
    public id: string,
    public item: T,
    public children: ResourceTreeNode<T>[] = []
  ) {}
}

export class ResourceTree<T extends Resource> {
  private root: ResourceTreeNode<T>;

  constructor(rootItem: T) {
    this.root = new ResourceTreeNode<T>(rootItem.id, rootItem);
  }

  addNode(item: T, parentId: string): void {
    const parentNode = this.findNode(parentId);
    if (parentNode) {
      parentNode.children.push(new ResourceTreeNode<T>(item.id, item));
    }
  }

  removeNode(id: string): void {
    this.removeNodeRecursive(this.root, id);
  }

  private removeNodeRecursive(node: ResourceTreeNode<T>, id: string): boolean {
    const index = node.children.findIndex(child => child.id === id);
    if (index !== -1) {
      node.children.splice(index, 1);
      return true;
    }
    for (const child of node.children) {
      if (this.removeNodeRecursive(child, id)) {
        return true;
      }
    }
    return false;
  }

  findNode(id: string): ResourceTreeNode<T> | undefined {
    return this.findNodeRecursive(this.root, id);
  }

  private findNodeRecursive(node: ResourceTreeNode<T>, id: string): ResourceTreeNode<T> | undefined {
    if (node.id === id) return node;
    for (const child of node.children) {
      const found = this.findNodeRecursive(child, id);
      if (found) return found;
    }
    return undefined;
  }

}