// ContentDataTree.ts
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

  private updateNode(id: K, newValue: any): void {
    const node = this.get(id);
    if (node) {
      node.item = newValue;
    }
  }
}