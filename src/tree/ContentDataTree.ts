import { Tree } from './Tree';

export class ContentDataTree<K> extends Tree<K, any> {
  getValueByPath(path: string): any {
    const parts = path.split('.');
    let current: any = this.root.item;

    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      if (Array.isArray(current) && !isNaN(Number(part))) {
        current = current[Number(part)];
      } else {
        current = current[part];
      }
    }

    return current;
  }

  setValueByPath(path: string, value: any): void {
    const parts = path.split('.');
    const lastPart = parts.pop()!;
    let current: any = this.root.item;

    for (const part of parts) {
      if (current[part] === undefined || current[part] === null) {
        current[part] = isNaN(Number(parts[parts.indexOf(part) + 1])) ? {} : [];
      }
      current = current[part];
    }

    current[lastPart] = value;
    this.updateNode(this.root.id, this.root.item);
  }

  // New method to get child paths
  getChildPaths(path: string): string[] {
    const value = this.getValueByPath(path);
    if (typeof value !== 'object' || value === null) {
      return [];
    }
    return Object.keys(value).map(key => path ? `${path}.${key}` : key);
  }

  // New method to get parent path
  getParentPath(path: string): string {
    const parts = path.split('.');
    parts.pop();
    return parts.join('.');
  }

  // New method to add a child
  addChild(parentPath: string, childValue: any): string {
    const parentValue = this.getValueByPath(parentPath);
    if (Array.isArray(parentValue)) {
      parentValue.push(childValue);
      this.setValueByPath(parentPath, parentValue);
      return `${parentPath}.${parentValue.length - 1}`;
    } else if (typeof parentValue === 'object' && parentValue !== null) {
      const childKey = `child_${Date.now()}`;
      this.setValueByPath(`${parentPath}.${childKey}`, childValue);
      return `${parentPath}.${childKey}`;
    } else {
      throw new Error(`Cannot add child to ${parentPath}`);
    }
  }

  // New method to remove a child
  removeChild(path: string): void {
    const parentPath = this.getParentPath(path);
    const parentValue = this.getValueByPath(parentPath);
    const childKey = path.split('.').pop()!;

    if (Array.isArray(parentValue)) {
      const index = Number(childKey);
      parentValue.splice(index, 1);
      this.setValueByPath(parentPath, parentValue);
    } else if (typeof parentValue === 'object' && parentValue !== null) {
      delete parentValue[childKey];
      this.setValueByPath(parentPath, parentValue);
    } else {
      throw new Error(`Cannot remove child from ${parentPath}`);
    }
  }

  private updateNode(id: K, newValue: any): void {
    const node = this.get(id);
    if (node) {
      node.item = newValue;
    }
  }
}