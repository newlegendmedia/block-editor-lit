import { ContentId } from '../content/content';

export class ContentDependencyMap {
  private parentToChildren: Map<ContentId, Set<ContentId>> = new Map();
  private childToParents: Map<ContentId, Set<ContentId>> = new Map();

  updateDependencies(id: ContentId, childIds: ContentId[]): void {
    // Remove old child dependencies
    const oldChildren = this.parentToChildren.get(id) || new Set();
    oldChildren.forEach(childId => {
      const parents = this.childToParents.get(childId);
      if (parents) {
        parents.delete(id);
        if (parents.size === 0) {
          this.childToParents.delete(childId);
        }
      }
    });

    // Add new child dependencies
    this.parentToChildren.set(id, new Set(childIds));
    childIds.forEach(childId => {
      if (!this.childToParents.has(childId)) {
        this.childToParents.set(childId, new Set());
      }
      this.childToParents.get(childId)!.add(id);
    });
  }

  removeDependencies(id: ContentId): void {
    // Remove parent-to-children relationships
    const children = this.parentToChildren.get(id);
    if (children) {
      children.forEach(childId => {
        const parents = this.childToParents.get(childId);
        if (parents) {
          parents.delete(id);
          if (parents.size === 0) {
            this.childToParents.delete(childId);
          }
        }
      });
    }
    this.parentToChildren.delete(id);

    // Remove child-to-parent relationships
    const parents = this.childToParents.get(id);
    if (parents) {
      parents.forEach(parentId => {
        const children = this.parentToChildren.get(parentId);
        if (children) {
          children.delete(id);
          if (children.size === 0) {
            this.parentToChildren.delete(parentId);
          }
        }
      });
    }
    this.childToParents.delete(id);
  }

  canDelete(id: ContentId): boolean {
    return !this.childToParents.has(id);
  }
}
