import { Tree } from '../tree/Tree';
import { Content, ContentId } from '../content/content';
import { ContentTreeNode } from './ContentTreeNode';

export class ContentTree extends Tree<ContentId, Content> {
    constructor() {
      super('root', { id: 'root', modelInfo: { type: 'root', key: 'root' }, content: {} });
    }
  
    getContentById(id: ContentId): Content | undefined {
        return this.get(id)?.item;
    }
  
    addContent(content: Content, parentId?: ContentId): void {
      const existingNode = this.get(content.id);
      if (existingNode) {
        existingNode.item = content;
      } else {
//        const newNode = new ContentTreeNode(content.id, content);
        this.add(content, parentId, content.id);
      }
    }
  
    updateContent(content: Content): void {
      const node = this.get(content.id);
      if (node) {
        node.item = content;
      } else {
        // If the node doesn't exist, we add it
        this.addContent(content);
      }
    }
  
    removeContent(id: ContentId): void {
      this.remove(id);
    }
  
    protected override createNode(id: ContentId, item: Content): ContentTreeNode {
      return new ContentTreeNode(id, item);
    }
}