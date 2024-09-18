import { ResourceStore } from '../resource/ResourceStore';
import { Model, ModelType } from './model';
import { StorageAdapter } from '../storage/StorageAdapter';
import { DEFAULT_SCHEMA_NAME } from './SchemaStorage';
import { SchemaStorage } from './SchemaStorage';
import { isModelReference, isObject, isArray, isGroup } from './model';
import { HierarchicalItem } from '../tree/HierarchicalItem';
import { ModelSchema } from './model';
import { deepClone } from '../util/deepClone';
import { IndexedDBAdapter } from '../storage/IndexedDBAdapter';

export class ModelStore extends ResourceStore<string, Model> {
	private schemas: Map<string, ModelSchema> = new Map();

	constructor(storage: StorageAdapter<Model>) {
		const rootModel: Model = { id: 'root', type: 'root', key: 'root' };
		super(storage, 'root', rootModel);
	}

	async getDefinition(
		key: string,
		type: ModelType,
		schemaName: string = DEFAULT_SCHEMA_NAME
	): Promise<Model | undefined> {
		return this.getModel(key, type, schemaName);
	}

	async getModel(
		path: string,
		type: ModelType,
		schemaName: string = DEFAULT_SCHEMA_NAME
	): Promise<Model | undefined> {
		const existingModel = await this.get(path);

		if (existingModel) {
			return existingModel;
		}

		const schema = this.schemas.get(schemaName);
		if (!schema) {
			console.warn(`Schema not found: ${schemaName}`);
			return undefined;
		}

		const rawModel = this.findModelInSchema(schema, type, path);
		if (!rawModel) {
			console.warn(`Model not found in schema: ${type}  ${path}`);
			return undefined;
		}

		const resolvedModel = await this.resolveStructure(rawModel, schemaName, path);

		this.subscriptions.notifyAll();

		return resolvedModel;
	}

	private async getModelfromSchema(
		path: string,
		type: ModelType,
		schemaName: string = DEFAULT_SCHEMA_NAME
	): Promise<Model | undefined> {
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

		return rawModel;
	}

	private findModelInSchema(schema: ModelSchema, type: ModelType, key: string): Model | undefined {
		return schema.models[type]?.[key];
	}

	private async resolveStructure(
		model: Model,
		schemaName: string,
		currentPath: string,
		parentPath: string = ''
	): Promise<Model> {
		let resolvedModel = deepClone(model);

		if (isModelReference(model) && model.ref) {
			const referencedModel = await this.getModelfromSchema(model.ref, model.type, schemaName);

			if (!referencedModel) {
				console.warn(`Failed to resolve reference: ${model.ref}`);
				return resolvedModel;
			}
			delete model.ref;
			resolvedModel = deepClone({ ...referencedModel, ...model });
			return this.resolveStructure(resolvedModel, schemaName, currentPath, parentPath);
		}

		resolvedModel.path = currentPath;

		// Add the model to the tree before processing its children
		this.tree.add(resolvedModel, parentPath, currentPath);

		if (isObject(resolvedModel)) {
			resolvedModel = await this.resolveObjectModel(resolvedModel, schemaName, currentPath);
		} else if (isArray(resolvedModel)) {
			resolvedModel = await this.resolveArrayModel(resolvedModel, schemaName, currentPath);
		} else if (isGroup(resolvedModel)) {
			resolvedModel = await this.resolveGroupModel(resolvedModel, schemaName, currentPath);
		}

		// Update the model in the tree after processing
		this.tree.replace(currentPath, resolvedModel);

		return resolvedModel;
	}

	private async resolveObjectModel(
		model: Model,
		schemaName: string,
		currentPath: string
	): Promise<Model> {
		if (!isObject(model)) return model;

		const resolvedProperties = [];

		for (const property of model.properties) {
			const propertyPath = `${currentPath}.${property.key}`;
			const resolvedProperty = await this.resolveStructure(
				property,
				schemaName,
				propertyPath,
				currentPath
			);
			resolvedProperties.push(resolvedProperty);
		}

		return { ...model, properties: resolvedProperties };
	}

	private async resolveArrayModel(
		model: Model,
		schemaName: string,
		currentPath: string
	): Promise<Model> {
		if (!isArray(model)) return model;

		const itemTypePath = `${currentPath}.${model.itemType.key}`;
		const resolvedItemType = await this.resolveStructure(
			model.itemType,
			schemaName,
			itemTypePath,
			currentPath
		);
		return { ...model, itemType: resolvedItemType };
	}

	private async resolveGroupModel(
		model: Model,
		schemaName: string,
		currentPath: string
	): Promise<Model> {
		if (!isGroup(model)) return model;

		if (Array.isArray(model.itemTypes)) {
			const resolvedItemTypes = [];

			for (let i = 0; i < model.itemTypes.length; i++) {
				const item = model.itemTypes[i];
				const itemPath = `${currentPath}.${item.key}`;
				const resolvedItem = await this.resolveStructure(item, schemaName, itemPath, currentPath);
				resolvedItemTypes.push(resolvedItem);
			}
			return { ...model, itemTypes: resolvedItemTypes };
		} else {
			const itemPath = `${currentPath}.${model.itemTypes.key}`;
			const resolvedItemTypes = await this.resolveStructure(
				model.itemTypes,
				schemaName,
				itemPath,
				currentPath
			);
			return { ...model, itemTypes: resolvedItemTypes };
		}
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

	protected getParentId(_item: Model): string | undefined {
		// Implement based on your model structure
		// For example, you might use a convention like `${item.type}.${item.key}`
		return undefined;
	}
}

// Create a singleton instance of IndexedDBAdapter for ModelStore
const modelStorageAdapter = new IndexedDBAdapter<Model>('model-store', 1);

// Create a singleton instance of ModelStore
export const modelStore = new ModelStore(modelStorageAdapter);
