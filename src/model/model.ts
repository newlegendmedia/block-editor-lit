export type ModelType = 'element' | 'object' | 'array' | 'group';

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

export interface BaseModel {
  type: ModelType;
  key: string;
  name?: string;
  config?: Record<string, Model>;
  metadata?: Record<string, Model>;
  required?: boolean;
}

export interface ElementModel extends BaseModel {
  type: 'element';
  base: AtomType;
}

export type CompositeType = 'keyed' | 'indexed';

export interface CompositeModelBase extends BaseModel {
  childrenType?: CompositeType;
}

export interface ObjectModel extends CompositeModelBase {
  type: 'object';
  properties: Model[];
  childrenType?: 'keyed';
}

export interface ArrayModel extends CompositeModelBase {
  type: 'array';
  itemType: Model | ModelReference;
  repeatable?: boolean;
  childrenType?: 'indexed';
}

export interface GroupModel extends CompositeModelBase {
  type: 'group';
  itemTypes: (Model | ModelReference)[] | ModelReference;
  editable?: boolean;
  childrenType?: 'indexed';
}

export type ModelReference = BaseModel & {
  ref: string;
};

export type Model =
  | ElementModel
  | ObjectModel
  | ArrayModel
  | GroupModel
  | ModelReference;

export type CompositeModel = ObjectModel | ArrayModel | GroupModel;

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

export function isModelReference(model: Model): model is ModelReference {
  return 'ref' in model && typeof model.ref === 'string';
}

export function isCompositeModel(model: Model): model is CompositeModel {
  return ['object', 'array', 'group'].includes(model.type);
}
