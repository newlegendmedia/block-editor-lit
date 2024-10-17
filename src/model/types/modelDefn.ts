//
// MODEL DefnS - Removes the id and remaps the child arrays to the defn types
//
import { ArrayModel, ElementModel, GroupModel, ModelType, ObjectModel } from './model';

export interface BaseModelDefn {
	key: string;
	type: ModelType;
}

export type ElementModelDefn = Omit<ElementModel, 'id'>;
export type ObjectModelDefn = Omit<ObjectModel, 'id' | 'properties'> & {
	properties: (ModelDefn | ModelRefDefn)[];
};

export type ArrayModelDefn = Omit<ArrayModel, 'id' | 'itemType'> & {
	itemType: ModelDefn | ModelRefDefn;
};
export type GroupModelDefn = Omit<GroupModel, 'id' | 'itemTypes'> & {
	itemTypes: (ModelDefn | ModelRefDefn)[];
};

export function isElementDefn(model: any): model is ElementModelDefn {
	return model.type === 'element' && 'base' in model && !('id' in model) && !('ref' in model);
}
export function isObjectDefn(model: any): model is ObjectModelDefn {
	return model.type === 'object' && 'properties' in model && !('id' in model) && !('ref' in model);
}
export function isArrayDefn(model: any): model is ArrayModelDefn {
	return model.type === 'array' && 'itemType' in model && !('id' in model) && !('ref' in model);
}
export function isGroupDefn(model: any): model is GroupModelDefn {
	return model.type === 'group' && 'itemTypes' in model && !('id' in model) && !('ref' in model);
}

export type CompositeModelDefn = ObjectModelDefn | ArrayModelDefn | GroupModelDefn;
export type ValueModelDefn = ElementModelDefn;
export type ModelDefn = ElementModelDefn | ObjectModelDefn | ArrayModelDefn | GroupModelDefn;

export function isCompositeModelDefn(model: any): model is CompositeModelDefn {
	return (
		(model.type === 'object' || model.type === 'array' || model.type === 'group') &&
		!('id' in model) &&
		!('ref' in model)
	);
}
export function isValueModelDefn(model: any): model is ValueModelDefn {
	return model.type === 'element' && !('id' in model) && !('ref' in model);
}
export function isModelDefn(model: any): model is ModelDefn {
	return 'type' in model && !('id' in model) && !('ref' in model);
}

export type ModelRefProps = {
	type: string;
	ref: string;
};

export type ElementModelRefDefn = Omit<ElementModel, 'id' | 'base'> & ModelRefProps;
export type GroupModelRefDefn = Omit<GroupModel, 'id' | 'itemTypes'> & ModelRefProps;
export type ArrayModelRefDefn = Omit<ArrayModel, 'id' | 'itemType'> & ModelRefProps;
export type ObjectModelRefDefn = Omit<ObjectModel, 'id' | 'properties'> & ModelRefProps;

export type ModelRefDefn =
	| ElementModelRefDefn
	| GroupModelRefDefn
	| ArrayModelRefDefn
	| ObjectModelRefDefn;

export function isModelRefDefn(model: any): model is ModelRefDefn {
	return 'type' in model && 'ref' in model && !('id' in model);
}

export function isElementRefDefn(model: any): model is ElementModelRefDefn {
	return model.type === 'element' && 'ref' in model && !('id' in model);
}

export function isObjectRefDefn(model: any): model is ObjectModelRefDefn {
	return model.type === 'object' && 'ref' in model && !('id' in model);
}

export function isArrayRefDefn(model: any): model is ArrayModelRefDefn {
	return model.type === 'array' && 'ref' in model && !('id' in model);
}

export function isGroupRefDefn(model: any): model is GroupModelRefDefn {
	return model.type === 'group' && 'ref' in model && !('id' in model) && !('itemTypes' in model);
}
