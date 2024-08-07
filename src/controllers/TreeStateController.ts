import { ReactiveController, ReactiveControllerHost } from 'lit';
import { PathTree } from '../tree/PathTree';
import { ExtendedTreeNode } from '../tree/ExtendedTreeNode';
import { Property, ModelDefinition, isModel, isList, isGroup, isElement } from '../types/ModelDefinition';
import { BaseBlock, ModelBlock, GroupBlock, ListBlock, ElementBlock } from '../blocks/BaseBlock';
import { ModelStateController } from './ModelStateController';
import { DocumentBlock } from '../blocks/DocumentBlock';
import { generateId } from '../util/generateId';

export class TreeStateController implements ReactiveController {
  host: ReactiveControllerHost;
  private tree: PathTree<string, any>;
  private modelStateController: ModelStateController;

  constructor(host: ReactiveControllerHost, modelDefinition: ModelDefinition, modelStateController: ModelStateController) {
    this.host = host;
    this.host.addController(this);
    this.tree = new PathTree<string, any>('root', {});
    this.modelStateController = modelStateController;
    this.initializeWithDocument(modelDefinition);
  }

  hostConnected() {
    // Initialization logic when the host element is connected
  }

  hostDisconnected() {
    // Cleanup logic when the host element is disconnected
  }

  getContentByPath(path: string): any {
    return this.tree.getNodeByPath(path)?.item;
  }

  setContentByPath(path: string, value: any) {
    const node = this.tree.getNodeByPath(path);
    if (node) {
      node.item = value;
      this.host.requestUpdate();
    }
  }

  getBlock(path: string): BaseBlock | undefined {
    return this.tree.getNodeByPath(path)?.block;
  }

  getChildBlocks(path: string): BaseBlock[] {
    const node = this.tree.getNodeByPath(path);
    return node ? node.children
      .map(child => (child as ExtendedTreeNode<string, any>).block)
      .filter((block): block is BaseBlock => block !== undefined) : [];
  }

  addChildBlock(parentPath: string, childProperty: Property) {
    const newId = generateId();
    const newPath = parentPath ? `${parentPath}.${newId}` : newId;
    const newNode = this.tree.add({}, parentPath ? this.tree.getNodeByPath(parentPath)?.id : undefined, newId);
    if (newNode) {
      newNode.block = this.createBlock(childProperty, newPath);
      this.host.requestUpdate();
    }
  }

  removeChildBlock(path: string) {
    const node = this.tree.getNodeByPath(path);
    if (node) {
      this.tree.remove(node.id);
      this.host.requestUpdate();
    }
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
    this.tree = new PathTree<string, any>('root', {});
    const rootNode = this.tree.getNodeByPath('root');
    if (rootNode) {
      rootNode.block = new DocumentBlock(documentModel, 'root', this, this.modelStateController);
    }
    this.createChildBlocks(documentModel.properties, 'root');
  }

  private createChildBlocks(properties: Property[], parentPath: string) {
    properties.forEach((prop) => {
      const path = `${parentPath}.${prop.key}`;
      const newNode = this.tree.add({}, this.tree.getNodeByPath(parentPath)?.id, prop.key);
      
      if (newNode) {
        newNode.block = this.createBlock(prop, path);

        if (isElement(prop)) {
          newNode.item = '';
        } else if (isModel(prop) || isGroup(prop)) {
          newNode.item = {};
          if (prop.properties) {
            this.createChildBlocks(prop.properties, path);
          }
        } else if (isList(prop)) {
          newNode.item = [];
        }
      }
    });
  }
}