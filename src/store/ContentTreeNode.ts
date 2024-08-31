import { TreeNode } from '../tree/TreeNode';
import { Content, ContentId } from '../content/content';

export class ContentTreeNode extends TreeNode<ContentId, Content> {
    private referenceCount: number = 0;
  
    constructor(id: ContentId, content: Content) {
      super(id, content);
    }
  
    incrementReferenceCount(): void {
      this.referenceCount++;
    }
  
    decrementReferenceCount(): void {
      this.referenceCount--;
    }
  
    getReferenceCount(): number {
      return this.referenceCount;
    }
  
    isShared(): boolean {
      return this.referenceCount > 1;
    }
}