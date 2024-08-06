import { ReactiveController, ReactiveControllerHost } from 'lit';
import { ModelItem, ModelDefinition, Property } from '../types/types';
import { ContentModelTree } from '../tree/ContentModelTree';

export class ModelStateController implements ReactiveController {
  private host: ReactiveControllerHost;
  private modelTree: ContentModelTree<string>;
  private modelDefinition: ModelDefinition;

  constructor(host: ReactiveControllerHost, modelDefinition: ModelDefinition) {
    this.host = host;
    this.host.addController(this);
    this.modelDefinition = modelDefinition;
    this.modelTree = new ContentModelTree<string>('root', modelDefinition);
  }

  getModelPropertyByPath(path: string): Property | undefined {
    return this.modelTree.getPropertyByPath(path);
  }

  getModelDefinition(): ModelDefinition {
    return this.modelDefinition;
  }

  getModelTree(): ContentModelTree<string> {
    return this.modelTree;
  }

  hostConnected() {
    // Any initialization logic if needed
  }

  hostDisconnected() {
    // Any cleanup logic if needed
  }

  getModelForPath(path: string): ModelItem | undefined {
    const parts = path.split('.');
    let currentModel: ModelItem | undefined = this.modelDefinition;

    for (const part of parts) {
      if (!currentModel) return undefined;
      currentModel = currentModel.properties?.find(prop => prop.key === part) as ModelItem | undefined;
    }

    return currentModel;
  }

  // Add more methods as needed for model manipulation
}