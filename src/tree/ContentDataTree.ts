import { PathTree } from './PathTree';
import { PathTreeNode } from './PathTreeNode';

export class ContentDataTree extends PathTree<string, any> {
  getValueByPath(path: string): any {
    const node = this.getNodeByPath(path);
    return node ? node.item : undefined;
  }

  setValueByPath(path: string, value: any): void {
    const node = this.getNodeByPath(path);
    if (node) {
      node.item = value;
    } else {
      const parentPath = this.getParentPath(path);
      const key = path.split('.').pop()!;
      this.add(value, parentPath, key);
    }
  }

  getChildPaths(path: string): string[] {
    const node = this.getNodeByPath(path);
    return node ? node.children.map(child => `${path}.${child.id}`) : [];
  }

  getParentPath(path: string): string {
    const parts = path.split('.');
    parts.pop();
    return parts.join('.');
  }

  addChild(parentPath: string, childValue: any): string {
    const childKey = `child_${Date.now()}`;
    const childPath = parentPath ? `${parentPath}.${childKey}` : childKey;
    this.add(childValue, parentPath, childKey);
    return childPath;
  }

  removeChild(path: string): void {
    this.remove(path);
  }

  override getNodeByPath(path: string): PathTreeNode<string, any> | undefined {
    return super.getNodeByPath(path) as PathTreeNode<string, any> | undefined;
  }
}