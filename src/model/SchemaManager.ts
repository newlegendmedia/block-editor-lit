import {
	ElementModelDefn,
	isArrayDefn,
	isElementDefn,
	isGroupDefn,
	isModelRefDefn,
	isObjectDefn,
	Model,
	ModelDefn,
	ModelRefDefn,
	ModelSchema,
	ModelType,
} from '../content/contentTypes';

export class SchemaManager {
	private schemas: Map<string, ModelSchema> = new Map();

	async loadSchema(schemaName: string, schemaData: ModelSchema): Promise<void> {
		this.schemas.set(schemaName, schemaData);
	}

	async getModel(schemaName: string, modelType: ModelType, modelKey: string): Promise<Model> {
		const modelDef = await this.getModelDefn(schemaName, modelType, modelKey);
		if (!modelDef) {
			throw new Error(`Model definition not found: ${modelType}.${modelKey}`);
		}
		const resolvedDef = await this.resolveModelDefn(schemaName, modelDef);
		return this.resolvedModelDefToModel(resolvedDef);
	}

	resolvedModelDefToModel(modelDef: ModelDefn | ModelRefDefn): Model {
		let defaultModelProps = {
			id: modelDef.key,
			type: modelDef.type,
			key: modelDef.key,
		};
		switch (true) {
			case isElementDefn(modelDef):
				modelDef = modelDef as ElementModelDefn;
				return {
					...defaultModelProps,
					...modelDef,
				};
			case isObjectDefn(modelDef):
				return {
					...defaultModelProps,
					...modelDef,
					properties: modelDef.properties.map((prop) => this.resolvedModelDefToModel(prop)),
				};
			case isArrayDefn(modelDef):
				return {
					...defaultModelProps,
					...modelDef,
					itemType: this.resolvedModelDefToModel(modelDef.itemType),
				};
			case isGroupDefn(modelDef):
				return {
					...defaultModelProps,
					...modelDef,
					itemTypes: modelDef.itemTypes.map((item) => this.resolvedModelDefToModel(item)),
				};
			default:
				throw new Error(`Invalid model definition: ${modelDef}`);
		}
	}

	async getModelDefn(
		schemaName: string,
		modelType: ModelType,
		modelKey: string
	): Promise<ModelDefn | ModelRefDefn | undefined> {
		const schema = this.schemas.get(schemaName);
		return schema?.models[modelType]?.[modelKey];
	}

	async resolveModelDefn(
		schemaName: string,
		modelDef: ModelDefn | ModelRefDefn
	): Promise<ModelDefn> {
		switch (true) {
			case isModelRefDefn(modelDef):
				const baseDef = await this.getModelDefn(
					schemaName,
					modelDef.type as ModelType,
					modelDef.ref
				);
				if (!baseDef) {
					throw new Error(`Referenced model '${modelDef.ref}' not found in schema '${schemaName}'`);
				}
				// Merge the base definition with the reference definition
				const { ref, ...rest } = modelDef;
				const md = { ...baseDef, ...rest } as ModelDefn;
				return this.resolveModelDefn(schemaName, md);
			case isObjectDefn(modelDef):
				return {
					...modelDef,
					properties: await Promise.all(
						modelDef.properties.map((prop) => this.resolveModelDefn(schemaName, prop))
					),
				};
			case isArrayDefn(modelDef):
				return {
					...modelDef,
					itemType: await this.resolveModelDefn(schemaName, modelDef.itemType),
				};
			case isGroupDefn(modelDef):
				return {
					...modelDef,
					itemTypes: await Promise.all(
						modelDef.itemTypes.map((item) => this.resolveModelDefn(schemaName, item))
					),
				};
			case isElementDefn(modelDef):
				return modelDef; // ElementDefns don't need further resolution
			default:
				throw new Error(`Invalid model definition: ${modelDef}`);
		}
	}
}

export const schemaManager = new SchemaManager();
