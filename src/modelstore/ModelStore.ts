import { ResourceStore } from '../resourcestore/ResourceStore';
import { Model, ModelType, ModelId } from '../model/model';
import { StorageAdapter } from '../resourcestore/StorageAdapter';
import { DEFAULT_SCHEMA_NAME } from './constants';
import { SchemaStorage } from './SchemaStorage';
import { isArray, isGroup, isObject, ModelReference, isModelReference } from '../model/model';
import { HierarchicalItem } from '../tree/HierarchicalItem';
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

	async get(id: ModelId): Promise<Model | undefined> {
		return await super.get(id);
	}

	async set(model: Model, parentId?: ModelId): Promise<void> {
		return await super.set(model, parentId);
	}

	async delete(id: ModelId): Promise<void> {
		return super.delete(id);
	}


	async loadSchema(schemaName: string): Promise<void> {
		const schema = await SchemaStorage.loadSchema(schemaName);
		if (schema) {
			this.schemas.set(schemaName, schema);
		}
	}

	async getModel(
		modelPath: string,
		schemaName: string = DEFAULT_SCHEMA_NAME
	): Promise<Model | undefined> {
		// First, check if the model is already in the tree
		const existingModel = this.tree.get(modelPath)?.item;
		if (existingModel) {
			return existingModel;
		}

		// If not in the tree, load from schema and resolve
		const schema = this.schemas.get(schemaName);
		if (!schema) {
			return undefined;
		}

		const rawModel = this.findModelInSchema(schema, modelPath);
		if (!rawModel) {
			return undefined;
		}

		// Deeply resolve the model and its hierarchy
		const resolvedModel = await this.deepResolveModel(schemaName, rawModel, modelPath);
		return resolvedModel;
	}

	private findModelInSchema(schema: ModelSchema, modelPath: string): Model | undefined {
		// If modelPath contains a dot, it's a fully qualified path
		if (modelPath.includes('.')) {
			const [type, key] = modelPath.split('.');
			const pluralType = `${type}s` as keyof typeof schema.models;
			const model = schema.models[pluralType]?.[key];
			return model;
		}

		// If it doesn't contain a dot, search in all types
		for (const [type, models] of Object.entries(schema.models)) {
			if (models && modelPath in models) {
				return models[modelPath];
			}
		}

		return undefined;
	}

	private async deepResolveModel(
		schemaName: string,
		model: Model,
		modelPath: string,
		resolvedRefs: Set<string> = new Set(),
		depth: number = 0
	): Promise<Model> {
		const indent = '  '.repeat(depth);
		// Add the current model to the tree
		this.tree.add(model, this.getParentId(model), modelPath);
		if (isModelReference(model) && model.ref) {
			if (resolvedRefs.has(model.ref)) {
				return model;
			}

			const resolvedModel = await this.getModel(model.ref, schemaName);
			if (resolvedModel) {
				const mergedModel = { ...resolvedModel, ...model };
				// Only add to resolvedRefs after successful resolution
				resolvedRefs.add(model.ref);

				return this.deepResolveModel(schemaName, mergedModel, modelPath, resolvedRefs, depth + 1);
			} else {
				console.warn(`${indent}Failed to resolve reference: ${model.ref}`);
				return model;
			}
		}

		if (isObject(model)) {
			const resolvedProperties = await Promise.all(
				model.properties.map(async (prop, index) => {
					const propPath = `${modelPath}.properties[${index}]`;
					return this.deepResolveModel(
						schemaName,
						prop,
						propPath,
						new Set(resolvedRefs),
						depth + 1
					);
				})
			);
			return { ...model, properties: resolvedProperties };
		}

		if (isArray(model)) {
			const itemTypePath = `${modelPath}.itemType`;
			const resolvedItemType = await this.deepResolveModel(
				schemaName,
				model.itemType,
				itemTypePath,
				new Set(resolvedRefs),
				depth + 1
			);
			return { ...model, itemType: resolvedItemType };
		}

		if (isGroup(model)) {
			let resolvedItemTypes: Model[];
			if (Array.isArray(model.itemTypes)) {
				resolvedItemTypes = await Promise.all(
					model.itemTypes.map((item, index) => {
						const itemPath = `${modelPath}.itemTypes[${index}]`;
						return this.deepResolveModel(
							schemaName,
							item,
							itemPath,
							new Set(resolvedRefs),
							depth + 1
						);
					})
				);
			} else {
				const resolvedRef = await this.deepResolveModel(
					schemaName,
					model.itemTypes,
					`${modelPath}.itemTypes`,
					new Set(resolvedRefs),
					depth + 1
				);
				resolvedItemTypes = [resolvedRef];
			}
			return { ...model, itemTypes: resolvedItemTypes };
		}

		return model;
	}

	async getDefinition(
		key: string,
		type?: ModelType,
		schemaName: string = DEFAULT_SCHEMA_NAME
	): Promise<Model | undefined> {
		const modelPath = type ? `${type}.${key}` : key;
		return this.getModel(modelPath, schemaName);
	}

	private async resolveModelReferences(
		schemaName: string,
		model: Model,
		resolvedRefs: Set<string> = new Set()
	): Promise<Model> {
		if (isModelReference(model) && model.ref) {
			if (resolvedRefs.has(model.ref)) {
				console.warn(`Circular reference detected: ${model.ref}`);
				return model;
			}
			resolvedRefs.add(model.ref);

			const resolvedModel = await this.getModel(model.ref, schemaName);
			if (resolvedModel) {
				return this.resolveModelReferences(
					schemaName,
					{ ...resolvedModel, ...model },
					resolvedRefs
				);
			} else {
				console.warn(`Failed to resolve ref: ${model.ref}`);
				return model;
			}
		}

		if (isObject(model)) {
			const resolvedProperties = await Promise.all(
				model.properties.map((prop) =>
					this.resolveModelReferences(schemaName, prop, new Set(resolvedRefs))
				)
			);
			return { ...model, properties: resolvedProperties };
		}

		if (isArray(model)) {
			const resolvedItemType = await this.resolveModelReferences(
				schemaName,
				model.itemType,
				new Set(resolvedRefs)
			);
			return { ...model, itemType: resolvedItemType };
		}

		if (isGroup(model)) {
			let resolvedItemTypes: (Model | ModelReference)[];
			if (Array.isArray(model.itemTypes)) {
				resolvedItemTypes = await Promise.all(
					model.itemTypes.map((item) =>
						this.resolveModelReferences(schemaName, item, new Set(resolvedRefs))
					)
				);
			} else {
				const resolvedRef = await this.resolveModelReferences(
					schemaName,
					model.itemTypes,
					new Set(resolvedRefs)
				);
				if (isGroup(resolvedRef)) {
					resolvedItemTypes = Array.isArray(resolvedRef.itemTypes)
						? resolvedRef.itemTypes
						: [resolvedRef.itemTypes];
				} else {
					console.warn(
						`Invalid itemTypes reference: ${JSON.stringify(
							model.itemTypes
						)}. Must refer to a group.`
					);
					return model;
				}
			}
			return { ...model, itemTypes: resolvedItemTypes };
		}

		return model;
	}

	async getAll(): Promise<Model[]> {
		return await super.getAll();
	}

	async getAllHierarchical(): Promise<HierarchicalItem<Model>> {
		const models = this.tree.getAllHierarchical();
		return models;
	}

	protected getParentId(item: Model): string | undefined {
		// Implement this method based on your model structure
		// For example, you might use a convention like `${item.type}.${item.key}`
		return undefined;
	}

	subscribeAll(callback: () => void): () => void {
		super.subscribeToAll(callback);
		return () => {};
	}

	// Implement other methods as needed...
}
