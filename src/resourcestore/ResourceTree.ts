// ResourceTree.ts
import { Resource } from './Resource';
import { ResourceTreeNode } from './ResourceTreeNode';

export class ResourceTree<K, T extends Resource> {
    private nodes: Map<K, ResourceTreeNode<K, T>> = new Map();
    private root: ResourceTreeNode<K, T>;
  
    constructor(rootId: K, rootItem: T) {
      this.root = new ResourceTreeNode(rootId, rootItem);
      this.nodes.set(rootId, this.root);
    }
  
    get(id: K): ResourceTreeNode<K, T> | undefined {
      return this.nodes.get(id);
    }
  
    add(item: T, parentId?: K): ResourceTreeNode<K, T> | undefined {
      const node = new ResourceTreeNode(item.id as K, item, parentId || null);
      this.nodes.set(item.id as K, node);
      if (parentId) {
        const parentNode = this.nodes.get(parentId);
        if (parentNode) {
          parentNode.children.push(node);
          return node;
        }
      }
      return undefined;
    }
  
    remove(id: K): void {
      const node = this.nodes.get(id);
      if (node) {
        if (node.parentId) {
          const parentNode = this.nodes.get(node.parentId);
          if (parentNode) {
            parentNode.children = parentNode.children.filter(child => child.id !== id);
          }
        }
        this.nodes.delete(id);
      }
    }
 
    // Additional methods as needed...
  }
  