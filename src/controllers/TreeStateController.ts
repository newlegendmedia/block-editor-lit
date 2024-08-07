import { ReactiveController, ReactiveControllerHost } from 'lit';
import { PathTree } from '../tree/PathTree';
import { PathTreeNode } from '../tree/PathTreeNode';
import { Property, ModelDefinition, SimplifiedModelDefinition, isModel, isGroup, isElement, isList, BlockData } from '../types/ModelDefinition';
import { ElementBlock, ModelBlock, ListBlock, GroupBlock } from '../blocks/BaseBlock';
import { BaseBlock } from '../blocks/BaseBlock';
import { ModelStateController } from './ModelStateController';
import { DocumentBlock } from '../blocks/DocumentBlock';
import { generateId } from '../util/generateId';

export class TreeStateController implements ReactiveController {
  private tree: PathTree<string, BaseBlock>;
  
  constructor(
    private host: ReactiveControllerHost,
    modelDefinition: ModelDefinition,
    private modelStateController: ModelStateController
  ) {
    this.host.addController(this);
    
    const rootBlockData: BlockData = { content: {} };
    const rootModelDef: SimplifiedModelDefinition = this.modelStateController.getSimplifiedModelDefinition('root');
    
    this.tree = new PathTree<string, BaseBlock>(
      'root',
      new DocumentBlock(rootBlockData, rootModelDef, 'root', this.host)
    );
    
    this.initializeWithDocument(modelDefinition);
  }

  
  hostConnected() {
  }

  hostDisconnected() {
  }

  // Wrap key methods with debugging
  getBlock(path: string): { blockData: BlockData, modelDefinition: SimplifiedModelDefinition } | undefined {
    return this.getBlockData(path);
  }
  
  getBlockData(path: string): { blockData: BlockData, modelDefinition: SimplifiedModelDefinition } {
    console.log(`Getting block data for path: ${path}`);
    const node = this.tree.getNodeByPath(path);
    if (!node) {
      console.warn(`No node found for path: ${path}`);
      return { blockData: { content: undefined }, modelDefinition: { key: '', label: '', type: 'unknown' } };
    }
    const modelDef = this.modelStateController.getSimplifiedModelDefinition(path);
    return {
      blockData: { content: node.item.getContent() },
      modelDefinition: modelDef
    };
  }

  private createChildBlocks(properties: Property[], parentPath: string) {
    properties.forEach((prop) => {
      const path = `${parentPath}.${prop.key}`;
      const blockData: BlockData = { content: undefined };
      const simplifiedModelDef = this.modelStateController.simplifyModelDefinition(prop);
      const block = this.createBlock(blockData, simplifiedModelDef, path);
      this.tree.add(block, this.tree.getNodeByPath(parentPath)?.id, prop.key);
      
      if (isModel(prop) || isGroup(prop)) {
        this.createChildBlocks(prop.properties, path);
      } else if (isList(prop)) {
        // For now, we'll just create an empty list
        // Later, we can add functionality to populate the list with items
      }
    });
  }

  private createBlock(blockData: BlockData, simplifiedModelDef: SimplifiedModelDefinition, path: string): BaseBlock {
    switch (simplifiedModelDef.type) {
      case 'element':
        return new ElementBlock(blockData, simplifiedModelDef, path, this.host);
      case 'model':
        return new ModelBlock(blockData, simplifiedModelDef, path, this.host);
      case 'list':
        return new ListBlock(blockData, simplifiedModelDef, path, this.host);
      case 'group':
        return new GroupBlock(blockData, simplifiedModelDef, path, this.host);
      default:
        console.warn(`Unknown property type for ${path}. Defaulting to ElementBlock.`);
        return new ElementBlock(blockData, simplifiedModelDef, path, this.host);
    }
  }


  getChildBlocks(path: string): BaseBlock[] {
    const node = this.tree.getNodeByPath(path);
    const childBlocks = node ? node.children.map(child => (child as PathTreeNode<string, BaseBlock>).item) : [];
    return childBlocks;
  }

  addChildBlock(parentPath: string, childProperty: Property) {
    const newId = generateId();
    const newPath = parentPath ? `${parentPath}.${newId}` : newId;
    const newBlock = this.createBlock(childProperty, newPath);
    const addedNode = this.tree.add(newBlock, this.tree.getNodeByPath(parentPath)?.id, newId);
    
    if (addedNode) {
      this.requestUpdate(`addChildBlock: ${newPath}`);
    } else {
      console.warn(`TreeStateController: Failed to add child block at path: ${newPath}`);
    }
  }

  initializeWithDocument(documentModel: ModelDefinition) {
    // this.tree = new PathTree<string, BaseBlock>(
    //   'root',
    //   new DocumentBlock({ content: {} }, this.modelStateController.simplifyModelDefinition(documentModel), 'root', this.host)
    // );
    this.createChildBlocks(documentModel.properties, 'root');
  }

  getContentByPath(path: string): any {
    const blockData = this.getBlockData(path);
    return blockData ? blockData.blockData.content : undefined;
  }

setContentByPath(path: string, content: any): void {
  const node = this.tree.getNodeByPath(path);
  if (node && node.item instanceof BaseBlock) {
    node.item.setContent(content);
    this.requestUpdate(`setContentByPath: ${path}`);
  } else {
    console.warn(`No block found for path: ${path}`);
  }
}
  
  requestUpdate(_reason: string) {
    this.host.requestUpdate();
  }
}