// New Types for Content and Models
// The Primary Types are Resource, Model, and Content
// Resource is the base type that all other types extend and is used in the base class for the Model and Content Stores
// Model kinds are Model, ModelNode, ModelDefn, and ModelRefDefn
// ModelDefns are the models that are stored in the schema database - they are the raw models without an id
// ModelRefDefns are the Refs to other models that are stored in the schema database -
//  -- they are partials of the model Defns that are merged to override properties from the model Defns Refd by the ref property
// Models are the resolved models that are used to create content and are properties of the Blocks
// ModelNodes are the resolved models that are used in the ModelStore and are properties of the Model Tree
//  -- they are the resolved models with an id and parentId
// Content kinds are Content and ContentNode
// Content is the resolved content that is used to create the Blocks and is a property of the Blocks
// ContentNode is the resolved content that is used in the ContentStore and the Content Tree

export type ResourceId = string;

export interface Identifiable<I, T> {
	id: I;
	key: string;
	type: T;
	name?: string;
}

export interface CompositeContent<I> {
	children: I[];
	inlineChildren?: boolean;
}

export interface Hierarchical<I, H> {
	parentId: I | null;
	children: H[];
}

export interface Contentful<C> {
	content: C;
}

//
// RESOURCE
//
export type Resource = Identifiable<ResourceId, string>;

//
// MODEL
//
export const AtomType = {
	Boolean: 'boolean',
	Text: 'text',
	Number: 'number',
	Datetime: 'datetime',
	Enum: 'enum',
	File: 'file',
} as const;

export type AtomType = (typeof AtomType)[keyof typeof AtomType];

export type ModelId = string;

export type ModelType = 'element' | 'array' | 'group' | 'object' | 'root';

export interface CompositeModelProps {
	inlineChildren?: boolean;
}

export type BaseModel = Identifiable<ModelId, ModelType>;
export type BaseCompositeModel = BaseModel & CompositeModelProps;
export type BaseModelNode = BaseModel & Hierarchical<ModelId, ModelId>;

export interface RootModel extends BaseModel {
	type: 'root';
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
	itemType: Model;
	repeatable?: boolean;
}
export interface GroupModel extends BaseCompositeModel {
	type: 'group';
	itemTypes: Model[];
	editable?: boolean;
}
export function isRoot(model: Model): model is RootModel {
	return model.type === 'root';
}
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

export type CompositeModel = ObjectModel | ArrayModel | GroupModel;
export type ValueModel = ElementModel;

export function isCompositeModel(model: Model): model is CompositeModel {
	return isObject(model) || isArray(model) || isGroup(model);
}
export function isValueModel(model: Model): model is ValueModel {
	return isElement(model);
}

export type Model = RootModel | ValueModel | CompositeModel; // discriminated union
export type ModelNode = Model & Hierarchical<ModelId, ModelId>;

export function isModel(model: any): model is Model {
	return (isElement(model) || isCompositeModel(model)) && 'id' in model && !('parentId' in model);
}
export function isModelNode(model: any): model is ModelNode {
	return (
		(isRoot(model) || isElement(model) || isCompositeModel(model)) &&
		'id' in model &&
		'parentId' in model
	);
}
