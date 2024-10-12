import { Resource } from '../resource/Resource';

export type ModelType = 'element' | 'object' | 'array' | 'group' | 'root';

export const AtomType = {
	Boolean: 'boolean',
	Text: 'text',
	Number: 'number',
	Datetime: 'datetime',
	Enum: 'enum',
	File: 'file',
	Reference: 'reference',
} as const;

export type AtomType = (typeof AtomType)[keyof typeof AtomType];

export type ModelId = string;

export type BaseModelProps = {
	id?: ModelId;
	type: ModelType;
	key: string;
	name?: string;
	path?: string;
	config?: Record<string, Model>;
	metadata?: Record<string, Model>;
	required?: boolean;
};

export type BaseModel = Resource & BaseModelProps;

export interface BaseCompositeModel extends BaseModel {
	inlineChildren?: boolean;
}

export interface ElementModel extends BaseModel {
	type: 'element';
	base: AtomType;
}

export interface ObjectModel extends BaseCompositeModel {
	type: 'object';
	properties: Model[];
}

export interface ArrayModel extends BaseCompositeModel {
	type: 'array';
	itemType: Model | ModelReference;
	repeatable?: boolean;
}

export interface GroupModel extends BaseCompositeModel {
	type: 'group';
	itemTypes: Model[];
	editable?: boolean;
}

export type ModelReference = BaseModel & {
	ref?: string; // Make ref optional
};

export interface Model extends BaseModel {}

export type CompositeModel = ObjectModel | ArrayModel | GroupModel;

export type ModelWithoutId = Omit<BaseModelProps, 'id'>;

export interface ModelSchema {
	name: string;
	models: {
		[key in ModelType]?: Record<string, ModelWithoutId>;
	};
}

// Type guards (these remain unchanged)
export function isElement(model: Model): model is ElementModel {
	return model.type === 'element' && 'base' in model;
}

export function isObject(model: Model): model is ObjectModel {
	return model.type === 'object' && 'properties' in model;
}

export function isArray(model: Model): model is ArrayModel {
	return model.type === 'array' && 'itemType' in model;
}

export function isGroup(model: Model): model is GroupModel {
	return model.type === 'group' && 'itemTypes' in model;
}

// Update the isModelReference function
export function isModelReference(model: Model): model is ModelReference {
	return 'ref' in model && typeof (model as ModelReference).ref === 'string';
}

export function isCompositeModel(model: Model): model is CompositeModel {
	return ['object', 'array', 'group'].includes(model.type);
}
export function isIndexedCompositeModel(model: Model): model is CompositeModel {
	return ['array', 'group'].includes(model.type);
}
export function isKeyedCompositeModel(model: Model): model is CompositeModel {
	return ['object'].includes(model.type);
}
