import { ResourceStore } from '../resource/ResourceStore';
import { IndexedDBAdapter } from '../storage/IndexedDBAdapter';
import { StorageAdapter } from '../storage/StorageAdapter';
import { HierarchicalItem } from '../tree/HierarchicalItem';
import { deepClone } from '../util/deepClone';
import { DEFAULT_SCHEMA_NAME, SchemaStorage } from './SchemaStorage';
import {
	ArrayModel,
	GroupModel,
	isArray,
	isGroup,
	isModelReference,
	isObject,
	Model,
	ModelSchema,
	ModelType,
	ObjectModel,
} from './model';

export class ModelStore extends ResourceStore<Model> {
	private schemas: Map<string, ModelSchema> = new Map();

	constructor(storage: StorageAdapter<string, Model>) {
		const rootModel: Model = {
			id: 'root',
			type: 'root',
			key: 'root',
			parentId: null,
			children: [],
		};
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
		type?: ModelType,
		schemaName: string = DEFAULT_SCHEMA_NAME
	): Promise<Model | undefined> {
		const existingModel = await this.get(path);

		if (existingModel) {
			return existingModel;
		}

		if (!type) {
			console.warn(`Model type not specified: ${path}`);
			return undefined;
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

	async updatePath(oldPath: string, newPath: string): Promise<void> {
		const model = this.tree.get(oldPath);
		if (model) {
			this.tree.remove(oldPath);
			let parentId = model.parentId === null ? undefined : model.parentId;
			this.tree.add(model, parentId, newPath);
		}
	}

	private findModelInSchema(schema: ModelSchema, type: ModelType, key: string): Model | undefined {
		const model = schema.models[type]?.[key];
		if (!model) {
			console.warn(`Model not found in schema: ${type}.${key}`);
			return undefined;
		}
		// create a Model from the BaseModelDefinition
		return {
			...model,
			key: model.key || '',
			id: model.key || '',
			parentId: 'root',
			children: [],
		};
	}

	private async resolveStructure(
		model: Model,
		schemaName: string,
		currentPath: string,
		parentPath: string = ''
	): Promise<Model> {
		let resolvedModel = deepClone(model);

		resolvedModel = {
			...resolvedModel,
			id: currentPath,
			parentId: parentPath,
			children: [],
		};

		if (isModelReference(model)) {
			if (!model.ref) {
				console.warn(`Model reference is missing: ${model}`);
				return resolvedModel;
			}
			const referencedModel = await this.getModelfromSchema(model.ref, model.type, schemaName);

			if (!referencedModel) {
				console.warn(`Failed to resolve reference: ${model.ref}`);
				return resolvedModel;
			}
			delete model.ref;
			resolvedModel = deepClone({ ...referencedModel, ...model });
			return await this.resolveStructure(resolvedModel, schemaName, currentPath, parentPath);
		}

		resolvedModel.path = currentPath;
		resolvedModel.id = currentPath;

		// Add the model to the tree before processing its children
		if (parentPath === '') parentPath = 'root';
		this.tree.add(resolvedModel, parentPath, currentPath);

		if (isObject(resolvedModel)) {
			resolvedModel = await this.resolveObjectModel(resolvedModel, schemaName, currentPath);
		} else if (isArray(resolvedModel)) {
			resolvedModel = await this.resolveArrayModel(resolvedModel, schemaName, currentPath);
		} else if (isGroup(resolvedModel)) {
			resolvedModel = await this.resolveGroupModel(resolvedModel, schemaName, currentPath);
		}

		this.tree.set(currentPath, resolvedModel);
		return resolvedModel;
	}

	private async resolveObjectModel(
		model: Model,
		schemaName: string,
		currentPath: string
	): Promise<ObjectModel> {
		if (!isObject(model)) {
			throw new Error(`Model is not an object: ${model}`);
		}
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
		model: ArrayModel,
		schemaName: string,
		currentPath: string
	): Promise<ArrayModel> {
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
	): Promise<GroupModel> {
		if (!isGroup(model)) {
			throw new Error(`Model is not a group: ${model}`);
			``;
		}
		const resolvedItemTypes = [];

		for (let i = 0; i < model.itemTypes.length; i++) {
			const item = model.itemTypes[i];
			const itemPath = `${currentPath}.${item.key}`;
			const resolvedItem = await this.resolveStructure(item, schemaName, itemPath, currentPath);
			resolvedItemTypes.push(resolvedItem);
		}
		return { ...model, itemTypes: resolvedItemTypes };
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
}

// Create a singleton instance of IndexedDBAdapter for ModelStore
const modelStorageAdapter = new IndexedDBAdapter<Model>('model-store', 1);

// Create a singleton instance of ModelStore
export const modelStore = new ModelStore(modelStorageAdapter);
