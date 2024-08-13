import { Tree } from './Tree';
import { PathTreeNode } from './PathTreeNode';
import { generateId } from '../util/generateId';

export class PathTree<K, Item> extends Tree<K, Item> {
  protected override root: PathTreeNode<K, Item>;
  protected override nodes: Map<K, PathTreeNode<K, Item>>;
  private pathLookup: Map<string, K>;

  constructor(rootId: K, rootItem?: Item) {
    super(rootId, rootItem);
    this.root = new PathTreeNode(rootId, rootItem || {} as Item);
    this.nodes = new Map([[rootId, this.root]]);
    this.pathLookup = new Map();
    this.initializePathLookup();
  }


  override get(id: K): PathTreeNode<K, Item> | undefined {
    return this.nodes.get(id);
  }

  private initializePathLookup(): void {
    this.buildPathLookup(this.root as PathTreeNode<K, Item>);
  }

  private buildPathLookup(node: PathTreeNode<K, Item>, parentPath: string = ''): void {
    const currentPath = parentPath ? `${parentPath}.${node.id}` : `${node.id}`;
    this.pathLookup.set(currentPath, node.id);

    node.children.forEach(child => {
      this.buildPathLookup(child as PathTreeNode<K, Item>, currentPath);
    });
  }

  override add(item: Item, parentId?: K, id?: K): PathTreeNode<K, Item> | undefined {
    const nodeId = id || generateId() as K;
    let parentNode: PathTreeNode<K, Item> | undefined;
    let parentPath = '';

    if (parentId) {
      parentNode = this.nodes.get(parentId) as PathTreeNode<K, Item>;
      if (!parentNode) {
        console.warn(`Failed to add node: parent not found with id ${parentId}`, item, this.nodes);
        return undefined;
      }
      parentPath = this.getNodePath(parentId) || '';
    } else {
      parentNode = this.root;
    }

    const newNode = new PathTreeNode(nodeId, item, parentId || null);
    parentNode.children.push(newNode);
    this.nodes.set(nodeId, newNode);

    const newPath = parentPath ? `${parentPath}.${nodeId}` : `${nodeId}`;
    this.pathLookup.set(newPath, nodeId);

    console.log(`Added node to PathTree: ${newPath}`);
    return newNode;
  }


  override remove(nodeId: K): void {
    const nodePath = this.getNodePath(nodeId);
    if (nodePath) {
      this.removePathAndChildren(nodePath);
    }
    super.remove(nodeId);
  }

  private removePathAndChildren(path: string): void {
    this.pathLookup.forEach((_, key) => {
      if (key.startsWith(path)) {
        this.pathLookup.delete(key);
      }
    });
  }

  getNodeByPath(path: string): PathTreeNode<K, Item> | undefined {
    const nodeId = this.pathLookup.get(path);
    return nodeId ? this.nodes.get(nodeId) as PathTreeNode<K, Item> : undefined;
  }

  private getNodePath(nodeId: K): string | undefined {
    for (const [path, id] of this.pathLookup.entries()) {
      if (id === nodeId) {
        return path;
      }
    }
    return undefined;
  }  

//   movePath(fromPath: string, toPath: string): boolean {
//     const nodeToMove = this.getNodeByPath(fromPath);
//     if (!nodeToMove) return false;

//     const newParentNode = this.getNodeByPath(toPath);
//     if (!newParentNode) return false;

//     // Remove the node from its current parent
//     const currentParent = this.nodes.get(nodeToMove.parentId!);
//     if (currentParent) {
//       currentParent.children = currentParent.children.filter(child => child.id !== nodeToMove.id);
//     }

//     // Add the node to its new parent
//     nodeToMove.parentId = newParentNode.id;
//     newParentNode.children.push(nodeToMove);

//     // Update path lookup
//     this.removePathAndChildren(fromPath);
//     this.buildPathLookup(nodeToMove, toPath);

//     return true;
//   }

//   getDescendants(path: string): PathTreeNode<K, Item>[] {
//     const descendants: PathTreeNode<K, Item>[] = [];
//     const node = this.getNodeByPath(path);
//     if (node) {
//       const traverse = (n: PathTreeNode<K, Item>) => {
//         n.children.forEach(child => {
//           descendants.push(child as PathTreeNode<K, Item>);
//           traverse(child as PathTreeNode<K, Item>);
//         });
//       };
//       traverse(node);
//     }
//     return descendants;
//   }

//   getAncestors(path: string): PathTreeNode<K, Item>[] {
//     const ancestors: PathTreeNode<K, Item>[] = [];
//     let currentPath = path;
//     while (currentPath.includes('.')) {
//       currentPath = currentPath.substring(0, currentPath.lastIndexOf('.'));
//       const ancestor = this.getNodeByPath(currentPath);
//       if (ancestor) {
//         ancestors.unshift(ancestor);
//       }
//     }
//     return ancestors;
//   }

//   findNodesByPredicate(predicate: (node: PathTreeNode<K, Item>) => boolean): PathTreeNode<K, Item>[] {
//     const result: PathTreeNode<K, Item>[] = [];
//     const traverse = (node: PathTreeNode<K, Item>) => {
//       if (predicate(node)) {
//         result.push(node);
//       }
//       node.children.forEach(child => traverse(child as PathTreeNode<K, Item>));
//     };
//     traverse(this.root);
//     return result;
//   }
}