export type PropertyType = 'element' | 'object' | 'array' | 'group';

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

export interface BaseProperty {
  type: PropertyType;
  key: string;
  name?: string;
  config?: Record<string, Property>;
  metadata?: Record<string, Property>;
  required?: boolean;
}

export interface ElementProperty extends BaseProperty {
  type: 'element';
  base: AtomType;
}

export interface CompositePropertyBase extends BaseProperty {
  childrenType?: 'keyed' | 'indexed';
}

export interface ObjectProperty extends CompositePropertyBase {
  type: 'object';
  properties: Property[];
}

export interface ArrayProperty extends CompositePropertyBase {
  type: 'array';
  itemType: Property | PropertyReference;
  repeatable?: boolean;
}

export interface GroupProperty extends CompositePropertyBase {
  type: 'group';
  itemTypes: (Property | PropertyReference)[] | PropertyReference;
  editable?: boolean;
}

export type PropertyReference = BaseProperty & {
  ref: string;
};

export type Property =
  | ElementProperty
  | ObjectProperty
  | ArrayProperty
  | GroupProperty
  | PropertyReference;

export type CompositeProperty = ObjectProperty | ArrayProperty | GroupProperty;

export type Model = ObjectProperty;

// Type guards (these remain unchanged)
export function isElement(property: Property): property is ElementProperty {
  return property.type === 'element' && 'base' in property;
}

export function isObject(property: Property): property is ObjectProperty {
  return property.type === 'object' && 'properties' in property;
}

export function isArray(property: Property): property is ArrayProperty {
  return property.type === 'array' && 'itemType' in property;
}

export function isGroup(property: Property): property is GroupProperty {
  return property.type === 'group' && 'itemTypes' in property;
}

export function isPropertyReference(property: Property): property is PropertyReference {
  return 'ref' in property && typeof property.ref === 'string';
}

export function isCompositeProperty(property: Property): property is CompositeProperty {
  return ['object', 'array', 'group'].includes(property.type);
}

export function isModel(property: Property): property is ObjectProperty {
  return property.type === 'object' && 'properties' in property;
}