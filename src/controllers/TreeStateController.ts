import { ReactiveController, ReactiveControllerHost } from 'lit';
import { ContentModelTree } from '../tree/ContentModelTree';
import { ContentDataTree } from '../tree/ContentDataTree';
import { Property, ModelDefinition, isModel, isList, isGroup, isElement } from '../types/ModelDefinition';
import { BaseBlock } from '../blocks/BaseBlock';
import { ModelStateController } from './ModelStateController';
import { ModelBlock, GroupBlock, ListBlock, ElementBlock } from '../blocks/BaseBlock';

export class TreeStateController implements ReactiveController {
  host: ReactiveControllerHost;
  private contentTree: ContentDataTree<string>;
  private modelTree: ContentModelTree<string>;
  private blockRegistry: Map<string, BaseBlock> = new Map();
  private modelStateController: ModelStateController;

  constructor(host: ReactiveControllerHost, modelTree: ContentModelTree<string>, modelStateController: ModelStateController) {
    this.host = host;
    this.host.addController(this);
    this.modelTree = modelTree;
    this.contentTree = new ContentDataTree<string>('root');
    this.modelStateController = modelStateController;
  }

  
  hostConnected() {
    // Initialization logic when the host element is connected
  }

  hostDisconnected() {
    // Cleanup logic when the host element is disconnected
  }

  getContentByPath(path: string): any {
    return this.contentTree.getValueByPath(path);
  }

  setContentByPath(path: string, value: any) {
    this.contentTree.setValueByPath(path, value);
    this.host.requestUpdate();
  }

  getModelPropertyByPath(path: string): Property | undefined {
    return this.modelTree.getPropertyByPath(path);
  }

  // New method to register a block
  registerBlock(path: string, block: BaseBlock) {
    this.blockRegistry.set(path, block);
  }

  getBlock(path: string): BaseBlock | undefined {
    
    const block = this.blockRegistry.get(path);
    
    return block;
  }

  // New method to get child blocks
  getChildBlocks(path: string): BaseBlock[] {
    const childPaths = this.contentTree.getChildPaths(path);
    return childPaths.map(childPath => this.getBlock(childPath)).filter((block): block is BaseBlock => block !== undefined);
  }

  // New method to add a child block
  addChildBlock(parentPath: string, childProperty: Property) {
    const newPath = this.contentTree.addChild(parentPath, {});
    const parentBlock = this.getBlock(parentPath);
    if (parentBlock) {
      const childBlock = this.createBlock(childProperty, newPath);
      parentBlock.addChild(childBlock);
      this.registerBlock(newPath, childBlock);
    }
  }

  // New method to remove a child block
  removeChildBlock(path: string) {
    const parentPath = this.contentTree.getParentPath(path);
    this.contentTree.removeChild(path);
    const parentBlock = this.getBlock(parentPath);
    const childBlock = this.getBlock(path);
    if (parentBlock && childBlock) {
      parentBlock.removeChild(childBlock);
    }
    this.blockRegistry.delete(path);
  }

  private createBlock(property: Property, path: string): BaseBlock {
    if (isElement(property)) {
      return new ElementBlock(property, path, this, this.modelStateController);
    } else if (isModel(property)) {
      return new ModelBlock(property, path, this, this.modelStateController);
    } else if (isList(property)) {
      return new ListBlock(property, path, this, this.modelStateController);
    } else if (isGroup(property)) {
      return new GroupBlock(property, path, this, this.modelStateController);
    } else {
      console.warn(`Unknown property type for ${path}. Defaulting to ElementBlock.`);
      return new ElementBlock(property, path, this, this.modelStateController);
    }
  }

  initializeWithDocument(documentModel: ModelDefinition) {
    
    this.modelTree = new ContentModelTree<string>('root', documentModel);
    this.contentTree = new ContentDataTree<string>('root');
    
    // Initialize the content tree with empty structure
    this.contentTree.setValueByPath('', {});
    
    // Create the root block
    const rootBlock = this.createBlock(documentModel, '');
    this.registerBlock('', rootBlock);

    // Recursively create child blocks
    this.createChildBlocks(documentModel.properties, '');

    
  }

  private createChildBlocks(properties: Property[], parentPath: string) {
    
    properties.forEach((prop) => {
      const path = parentPath ? `${parentPath}.${prop.key}` : prop.key;
      
      const block = this.createBlock(prop, path);
      this.registerBlock(path, block);
      

      // Initialize content
      if (isElement(prop)) {
        this.setContentByPath(path, '');
      } else if (isModel(prop) || isGroup(prop)) {
        this.setContentByPath(path, {});
        if (prop.properties) {
          this.createChildBlocks(prop.properties, path);
        }
      } else if (isList(prop)) {
        this.setContentByPath(path, []);
      }
    });
    
  }

  

  // Additional methods for tree manipulation can be added here
}