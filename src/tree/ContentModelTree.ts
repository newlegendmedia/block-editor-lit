import { PathTree } from './PathTree';
import { Property, ModelDefinition, isModel, isList, isGroup } from '../types/ModelDefinition';
import { PathTreeNode } from './PathTreeNode';

export class ContentModelTree extends PathTree<string, Property> {
  constructor(rootId: string, modelDefinition: ModelDefinition) {
    super(rootId, modelDefinition);
    this.buildTree(modelDefinition);
  }

  private buildTree(modelDef: Property, parentPath: string = ''): void {
    const currentPath = parentPath ? `${parentPath}.${modelDef.key}` : modelDef.key;
    
    if (parentPath) {
      this.add(modelDef, parentPath, modelDef.key);
    }

    if (isModel(modelDef) || isGroup(modelDef)) {
      modelDef.properties?.forEach(prop => {
        this.buildTree(prop, currentPath);
      });
    } else if (isList(modelDef)) {
      this.buildTree(modelDef.items, currentPath);
    }
  }

  getPropertyByPath(path: string): Property | undefined {
    const node = this.getNodeByPath(path);
    return node ? node.item : undefined;
  }

  override getNodeByPath(path: string): PathTreeNode<string, Property> | undefined {
    return super.getNodeByPath(path) as PathTreeNode<string, Property> | undefined;
  }
}