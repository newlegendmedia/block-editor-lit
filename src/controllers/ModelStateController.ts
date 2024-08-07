import { ReactiveController, ReactiveControllerHost } from 'lit';
import { ModelDefinition, SimplifiedModelDefinition, Property, isModel, isList, isGroup } from '../types/ModelDefinition';
import { ContentModelTree } from '../tree/ContentModelTree';
import { TreeStateController } from './TreeStateController';

export class ModelStateController implements ReactiveController {
  private host: ReactiveControllerHost;
  private modelTree: ContentModelTree;
  private modelDefinition: ModelDefinition;
  private treeStateController?: TreeStateController;

  constructor(
    host: ReactiveControllerHost, 
    modelDefinition: ModelDefinition
  ) {
    this.host = host;
    this.host.addController(this);
    this.modelDefinition = modelDefinition;
    this.modelTree = new ContentModelTree('root', modelDefinition);
  }

  getSimplifiedModelDefinition(path: string): SimplifiedModelDefinition {
    const fullDef = this.getModelPropertyByPath(path);
    if (!fullDef) {
      console.warn(`No property found for path: ${path}`);
      return {
        key: path, label: path, type: 'element'
      }
    }
    return this.simplifyModelDefinition(fullDef);
  }

  simplifyModelDefinition(def: Property): SimplifiedModelDefinition {
    return {
      key: def.key,
      label: def.label || def.key,
      type: def.type,
      // Add other necessary properties
    };
  }  

  setTreeStateController(treeStateController: TreeStateController) {
    this.treeStateController = treeStateController;
  }

  hostConnected() {
    // Initialization logic when the host element is connected
  }

  hostDisconnected() {
    // Cleanup logic when the host element is disconnected
  }

  getModelPropertyByPath(path: string): Property | undefined {
    if (!path || path === 'root') {
      return this.modelDefinition;
    }
    const parts = path.split('.');
    let current: Property = this.modelDefinition;
    for (const part of parts) {
      if (isModel(current) || isGroup(current)) {
        current = current.properties?.find(p => p.key === part) || current;
      } else if (isList(current)) {
        current = current.items;
      } else {
        console.warn(`Unexpected property type at ${path}`);
        return undefined;
      }
      if (!current) {
        console.warn(`Property not found at ${path}`);
        return undefined;
      }
    }
    return current;
  }

  getModelDefinition(): ModelDefinition {
    return this.modelDefinition;
  }

  getModelTree(): ContentModelTree {
    return this.modelTree;
  }

  // New method to validate content against model
  validateContent(path: string, content: any): boolean {
    const property = this.getModelPropertyByPath(path);
    if (!property) return false;

    // Basic type checking
    switch (property.type) {
      case 'element':
        // For simplicity, just check if content is not undefined
        return content !== undefined;
      case 'model':
        return typeof content === 'object' && content !== null;
      case 'list':
        return Array.isArray(content);
      case 'group':
        return typeof content === 'object' && content !== null;
      default:
        return false;
    }
  }

  getAllowedChildTypes(path: string): Property[] {
    
    const property = this.getModelPropertyByPath(path);
    if (!property) {
      console.warn(`No property found for path: ${path}`);
      return [];
    }

    
    if (isModel(property) || isGroup(property)) {
      
      return property.properties || [];
    } else if (isList(property)) {
      
      return [property.items];
    }

    
    return [];
  }

 // Update these methods to handle potential undefined treeStateController
 createNewBlock(parentPath: string, blockType: string): void {
  if (!this.treeStateController) {
    console.error('TreeStateController is not set');
    return;
  }
  const allowedTypes = this.getAllowedChildTypes(parentPath);
  const blockProperty = allowedTypes.find(prop => prop.key === blockType);
  
  if (blockProperty) {
    this.treeStateController.addChildBlock(parentPath, blockProperty);
    this.host.requestUpdate();
  } else {
    console.error(`Block type ${blockType} is not allowed as a child of ${parentPath}`);
  }
}

removeBlock(path: string): void {
  if (!this.treeStateController) {
    console.error('TreeStateController is not set');
    return;
  }
//  this.treeStateController.removeChildBlock(path);
  this.host.requestUpdate();
}

moveBlock(_fromPath: string, _toPath: string): void {
  if (!this.treeStateController) {
    console.error('TreeStateController is not set');
    return;
  }
  // This is a placeholder. Actual implementation would depend on your ContentDataTree structure
  
  this.host.requestUpdate();
}

  // Add more methods as needed for model manipulation
}