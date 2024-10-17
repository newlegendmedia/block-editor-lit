import { ResourceStore } from '../resource/ResourceStore';
import { IndexedDBAdapter } from '../storage/IndexedDBAdapter';
import { StorageAdapter } from '../storage/StorageAdapter';
import { schemaManager } from './SchemaManager';
import { SchemaStorage } from './SchemaStorage';
import { isArray, isGroup, isObject, ModelNode, ModelType } from './types/model';
import { ModelSchema } from './types/modelSchema';

export class ModelStore extends ResourceStore<ModelNode> {
	private schemas: Map<string, ModelSchema> = new Map();

	constructor(storage: StorageAdapter<string, ModelNode>) {
		const rootModel: ModelNode = {
			id: 'root',
			type: 'root',
			key: 'root',
			parentId: null,
			children: [],
		};
		super(storage, 'root', rootModel);
	}

	async getByPath(
		path: string,
		type?: ModelType,
		schemaName: string = 'default'
	): Promise<ModelNode | undefined> {
		const existingModel = await super.getByPath(path);
		if (existingModel) return existingModel;

		if (!type) {
			console.warn(`Model type not specified: ${path}`);
			return undefined;
		}

		try {
			const resolvedModel = await schemaManager.getModel(schemaName, type, path);
			// Convert to ModelNode
			const modelNode: ModelNode = {
				...resolvedModel,
				id: path,
				parentId: 'root',
				children: [],
			};

			await this.addModelRecursively(modelNode, 'root', path);
			return modelNode;
		} catch (error) {
			console.warn(`Model not found in schema: ${type} ${path}`);
			return undefined;
		}
	}

	private async addModelRecursively(
		model: ModelNode,
		parentId: string,
		parentPath: string
	): Promise<void> {
		const modelNode: ModelNode = {
			...model,
			parentId,
			children: [],
		};

		await this.create(modelNode, parentId, parentPath);

		if (isObject(model)) {
			for (const property of model.properties) {
				const propertyPath = `${parentPath}.${property.key}`;
				const childNode: ModelNode = {
					...property,
					id: propertyPath,
					parentId,
					children: [],
				};
				await this.addModelRecursively(childNode, model.id, propertyPath);
			}
		} else if (isArray(model)) {
			const key = model.itemType.key;
			const itemTypePath = `${parentPath}.${key}`;
			const childNode: ModelNode = {
				...model.itemType,
				id: itemTypePath,
				parentId,
				children: [],
			};
			await this.addModelRecursively(childNode, model.id, itemTypePath);
		} else if (isGroup(model)) {
			for (let i = 0; i < model.itemTypes.length; i++) {
				const key = model.itemTypes[i].key;
				const itemTypePath = `${parentPath}.${key}`;
				const childNode: ModelNode = {
					...model.itemTypes[i],
					id: itemTypePath,
					parentId,
					children: [],
				};
				await this.addModelRecursively(childNode, model.id, itemTypePath);
			}
		}
	}

	async loadSchema(schemaName: string): Promise<void> {
		const schema = await SchemaStorage.loadSchema(schemaName);

		if (schema) {
			this.schemas.set(schemaName, schema);
		}
	}
}

// Create a singleton instance of IndexedDBAdapter for ModelStore
const modelStorageAdapter = new IndexedDBAdapter<ModelNode>('model-store', 1);

// Create a singleton instance of ModelStore
export const modelStore = new ModelStore(modelStorageAdapter);
