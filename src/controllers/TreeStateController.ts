import { ReactiveController, ReactiveControllerHost } from 'lit';
import { PathTree } from '../tree/PathTree';
import { PathTreeNode } from '../tree/PathTreeNode';
import { Property, ModelDefinition, isModel, isGroup, isElement, isList } from '../types/ModelDefinition';
import { ElementBlock, ModelBlock, ListBlock, GroupBlock } from '../blocks/BaseBlock';
import { BaseBlock } from '../blocks/BaseBlock';
import { ModelStateController } from './ModelStateController';
import { DocumentBlock } from '../blocks/DocumentBlock';
import { generateId } from '../util/generateId';

export class TreeStateController implements ReactiveController {
  host: ReactiveControllerHost;
  private tree: PathTree<string, BaseBlock>;
  private modelStateController: ModelStateController;

  constructor(host: ReactiveControllerHost, modelDefinition: ModelDefinition, modelStateController: ModelStateController) {
    this.host = host;
    this.host.addController(this);
    this.modelStateController = modelStateController;
    
    this.tree = new PathTree<string, BaseBlock>('root', new DocumentBlock(modelDefinition, 'root', this, modelStateController));
    this.initializeWithDocument(modelDefinition);
  }
  
  hostConnected() {
  }

  hostDisconnected() {
  }

  // Wrap key methods with debugging
  getBlock(path: string): BaseBlock | undefined {
    return this.tree.getNodeByPath(path)?.item;
  }


  private createChildBlocks(properties: Property[], parentPath: string) {
    properties.forEach((prop) => {
      const path = `${parentPath}.${prop.key}`;
      const block = this.createBlock(prop, path);
      const newNode = this.tree.add(block, this.tree.getNodeByPath(parentPath)?.id, prop.key);
      
      if (newNode && (isModel(prop) || isGroup(prop)) && prop.properties) {
        this.createChildBlocks(prop.properties, path);
      }
    });
  }

  private createBlock(property: Property, path: string): BaseBlock {
    let block: BaseBlock;
    if (isElement(property)) {
      block = new ElementBlock(property, path, this, this.modelStateController);
    } else if (isModel(property)) {
      block = new ModelBlock(property, path, this, this.modelStateController);
    } else if (isList(property)) {
      block = new ListBlock(property, path, this, this.modelStateController);
    } else if (isGroup(property)) {
      block = new GroupBlock(property, path, this, this.modelStateController);
    } else {
      console.warn(`Unknown property type for ${path}. Defaulting to ElementBlock.`);
      block = new ElementBlock(property, path, this, this.modelStateController);
    }
    return block;
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
    this.tree = new PathTree<string, BaseBlock>('root', new DocumentBlock(documentModel, 'root', this, this.modelStateController));
    this.createChildBlocks(documentModel.properties, 'root');
  }

  getContentByPath(path: string): any {
    const block = this.getBlock(path);
    return block ? block.getContent() : undefined;
  }

  setContentByPath(path: string, content: any): void {
    const block = this.getBlock(path);
    if (block) {
      block.setContent(content);
    } else {
      console.warn(`No block found for path: ${path}`);
    }
  }
  
  requestUpdate(_reason: string) {
    this.host.requestUpdate();
  }
}