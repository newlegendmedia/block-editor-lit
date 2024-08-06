import { Tree } from './Tree';
import { Property, ModelDefinition, isModel, isList } from '../types/ModelDefinition';

export class ContentModelTree<K> extends Tree<K, Property> {
  constructor(rootId: K, modelDefinition: ModelDefinition) {
    super(rootId, modelDefinition);
    this.buildTree(modelDefinition);
  }

  private buildTree(modelDef: Property, parentId?: K) {
    let nodeId: K;
    if (parentId) {
      const newNode = this.add(modelDef, parentId);
      if (!newNode) {
        console.error(`Failed to add node for property: ${modelDef.key}`);
        return;
      }
      nodeId = newNode.id;
    } else {
      nodeId = this.getRootId();
    }
    
    if (isModel(modelDef) && modelDef.properties) {
      modelDef.properties.forEach(prop => {
        this.buildTree(prop, nodeId);
      });
    } else if (isList(modelDef) && modelDef.items) {
      this.buildTree(modelDef.items, nodeId);
    }
  }

  getPropertyByPath(path: string): Property | undefined {
    const parts = path.split('.');
    let currentNode = this.get(this.getRootId());
    
    for (const part of parts) {
      if (!currentNode) return undefined;
      currentNode = currentNode.children.find(child => child.item.key === part);
    }

    return currentNode ? currentNode.item : undefined;
  }
}