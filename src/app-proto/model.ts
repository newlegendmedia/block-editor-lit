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

export interface ObjectProperty extends BaseProperty {
	type: 'object';
	properties: Property[];
}

export interface ArrayProperty extends BaseProperty {
	type: 'array';
	itemType: Property | PropertyReference;
	repeatable?: boolean;
}

export interface GroupProperty extends BaseProperty {
	type: 'group';
	itemTypes: (Property | PropertyReference)[] | PropertyReference;
	editable?: boolean;
  }
  
type BasePropertyReference = {
	type: PropertyType;
	ref: string;
	key?: string;
	name?: string;
};

type ElementPropertyReference = BasePropertyReference;
type ObjectPropertyReference = BasePropertyReference;
type ArrayPropertyReference = Pick<ArrayProperty, 'repeatable'>;
type GroupPropertyReference = Pick<GroupProperty, 'editable'>;

export type PropertyReference = BasePropertyReference &
	(
		| ({ type: 'element' } & ElementPropertyReference)
		| ({ type: 'object' } & ObjectPropertyReference)
		| ({ type: 'array' } & ArrayPropertyReference)
		| ({ type: 'group' } & GroupPropertyReference)
	);


	export type Property =
	| ElementProperty
	| ObjectProperty
	| ArrayProperty
	| GroupProperty
	| PropertyReference;
  

export type Model = ObjectProperty;

// Type guard functions
export function isElement(property: Property): property is ElementProperty {
	return property.type === 'element' && 'base' in property;
}

export function isObject(property: Property): property is ObjectProperty {
	return property.type === 'object' && 'properties' in property;
}

export function isArray(property: Property): property is ArrayProperty {
	return property.type === 'array' && 'itemType' in property;
}

export function isPropertyReference(property: Property | PropertyReference): property is PropertyReference {
	return 'ref' in property && typeof property.ref === 'string';
  }
  
  export function isGroup(property: Property | PropertyReference): property is GroupProperty {
	return property.type === 'group' && 'itemTypes' in property;
  }
	
export function isModel(property: Property): property is ObjectProperty {
	return property.type === 'object' && 'properties' in property;
}
