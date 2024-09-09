// ModelStore.ts

import { ResourceStore } from '../resourcestore/ResourceStore';
import { Model, ModelType } from '../model/model';
import { StorageAdapter } from '../resourcestore/StorageAdapter';
import { DEFAULT_SCHEMA_NAME } from './constants';
import { SchemaStorage } from './SchemaStorage';
import { isModelReference, isObject, isArray, isGroup } from '../model/model';
import { HierarchicalItem } from '../tree/HierarchicalItem';

// ModelStore.ts or in a separate types file
export interface ModelSchema {
  name: string;
  models: {
    [key in ModelType]?: Record<string, Model>;
  };
}  
export class ModelStore extends ResourceStore<string, Model> {
  private schemas: Map<string, ModelSchema> = new Map();

  constructor(storage: StorageAdapter<Model>) {
    const rootModel: Model = { id: 'root', type: 'root', key: 'root' };
    super(storage, 'root', rootModel);
  }

  async getModel(path: string, type: ModelType, schemaName: string = DEFAULT_SCHEMA_NAME): Promise<Model | undefined> {
	console.log('getModel:', path, type, schemaName);
	const fullPath = `${schemaName}:${path}`;
	
	// First, check if the model is already in the tree
	const existingModel = this.tree.get(fullPath)?.item;
	if (existingModel) {
	  return existingModel;
	}
	
	// If the path contains a dot and it's not in the tree, we don't look in the schema
	if (path.includes('.')) {
	  console.warn(`Model not found in tree for path: ${path}`);
	  return undefined;
	}
  
	// If not in the tree, load from schema and resolve
	const schema = this.schemas.get(schemaName);
	if (!schema) {
	  console.warn(`Schema not found: ${schemaName}`);
	  return undefined;
	}
  
	const rawModel = this.findModelInSchema(schema, type, path);
	if (!rawModel) {
	  console.warn(`Model not found in schema: ${type}.${path}`);
	  return undefined;
	}
  
	// Deeply resolve the model and its hierarchy
	const resolvedModel = await this.deepResolveModel(schemaName, rawModel, fullPath);
	
	// Notify subscribers after adding a new model
	this.subscriptions.notifyAll();
  
	return resolvedModel;
  }
  
  private findModelInSchema(schema: ModelSchema, type: ModelType, key: string): Model | undefined {
	return schema.models[type]?.[key];
  }

  async getDefinition(key: string, type: ModelType, schemaName: string = DEFAULT_SCHEMA_NAME): Promise<Model | undefined> {
    return this.getModel(key, type, schemaName);
  }

  private async deepResolveModel(
    schemaName: string,
    model: Model,
    modelPath: string,
    parentPath: string | undefined = undefined,
    resolvedRefs: Set<string> = new Set()
  ): Promise<Model> {
    // Construct the full path
    const fullPath = parentPath ? `${parentPath}.${model.key}` : model.key;
    
    // Set the path property on the model
    model.path = fullPath;

    // Use the full path as the id when adding to the tree
    this.tree.add(model, parentPath, fullPath);

    if (isModelReference(model) && model.ref) {
      if (resolvedRefs.has(model.ref)) {
        return model;
      }

      const resolvedModel = await this.getDefinition(model.ref, model.type, schemaName);
      if (resolvedModel) {
        // Merge the resolved model with the original, preserving the original key
        const mergedModel = { ...resolvedModel, ...model, key: model.key };
        resolvedRefs.add(model.ref);
        return this.deepResolveModel(schemaName, mergedModel, modelPath, parentPath, resolvedRefs);
      } else {
        console.warn(`Failed to resolve reference: ${model.ref}`);
        return model;
      }
    }

    if (isObject(model)) {
      const resolvedProperties = await Promise.all(
        model.properties.map(async (prop, index) => {
          const propPath = `${fullPath}.${prop.key}`;
          return this.deepResolveModel(schemaName, prop, propPath, fullPath, new Set(resolvedRefs));
        })
      );
      return { ...model, properties: resolvedProperties };
    }

    if (isArray(model)) {
      const itemTypePath = `${fullPath}.itemType`;
      const resolvedItemType = await this.deepResolveModel(schemaName, model.itemType, itemTypePath, fullPath, new Set(resolvedRefs));
      return { ...model, itemType: resolvedItemType };
    }

    if (isGroup(model)) {
      let resolvedItemTypes: Model[];
      if (Array.isArray(model.itemTypes)) {
        resolvedItemTypes = await Promise.all(
          model.itemTypes.map(async (item, index) => {
            const itemPath = `${fullPath}.itemTypes[${index}]`;
            return this.deepResolveModel(schemaName, item, itemPath, fullPath, new Set(resolvedRefs));
          })
        );
      } else {
        const resolvedRef = await this.deepResolveModel(schemaName, model.itemTypes, `${fullPath}.itemTypes`, fullPath, new Set(resolvedRefs));
        resolvedItemTypes = [resolvedRef];
      }
      return { ...model, itemTypes: resolvedItemTypes };
    }

    return model;
  }
  
  async loadSchema(schemaName: string): Promise<void> {
    const schema = await SchemaStorage.loadSchema(schemaName);
    if (schema) {
      this.schemas.set(schemaName, schema);
    }
  }

  remove(path: string): void {
    this.tree.remove(path);
  }

  async getAll(): Promise<Model[]> {
    return await super.getAll();
  }

  async getAllHierarchical(): Promise<HierarchicalItem<Model>> {
    return this.tree.getAllHierarchical();
  }

  subscribeAll(callback: () => void): () => void {
    return super.subscribeToAll(callback);
  }	
	
  protected getParentId(item: Model): string | undefined {
    // Implement based on your model structure
    // For example, you might use a convention like `${item.type}.${item.key}`
    return undefined;
  }
}