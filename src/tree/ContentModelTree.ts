import { PathTree } from './PathTree';
import { Property, ModelDefinition, isModel, isList, isGroup } from '../types/ModelDefinition';
import { PathTreeNode } from './PathTreeNode';

export class ContentModelTree extends PathTree<string, Property> {
  constructor(rootId: string, modelDefinition: ModelDefinition) {
    super(rootId, modelDefinition);
  }

  override add(property: Property, parentId?: string, id?: string): PathTreeNode<string, Property> | undefined {
    console.log(`Adding to ContentModelTree: ${id || property.key}, parent: ${parentId || 'root'}`);
    return super.add(property, parentId, id || property.key);
  }

  getPropertyByPath(path: string): Property | undefined {
    console.log(`Getting property by path: ${path}`);
    const node = this.getNodeByPath(path);
    return node ? node.item : undefined;
  }

  override getNodeByPath(path: string): PathTreeNode<string, Property> | undefined {
    console.log(`Getting node by path: ${path}`);
    return super.getNodeByPath(path);
  }
}