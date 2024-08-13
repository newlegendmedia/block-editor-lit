import {
	Model,
	Property,
	PropertyType,
	ElementProperty,
	ObjectProperty,
	ArrayProperty,
	GroupProperty,
	isObject,
	isArray,
	isGroup,
	isPropertyReference
} from './model';

// Import JSON data
import modelsData from './models.json';
import elementsData from './elements.json';
import arraysData from './arrays.json';
import groupsData from './groups.json';

interface LibraryItem {
	type: PropertyType;
	definition: Property;
}

export class UnifiedLibrary {
	private items: Map<string, LibraryItem> = new Map();

	constructor() {
		this.loadAllData();
	}

	private loadAllData(): void {
		this.loadDefinitions('object', modelsData as Record<string, ObjectProperty>);
		this.loadDefinitions('element', elementsData as Record<string, ElementProperty>);
		this.loadDefinitions('array', arraysData as Record<string, ArrayProperty>);
		this.loadDefinitions('group', groupsData as Record<string, GroupProperty>);
	}

	private loadDefinitions(type: PropertyType, data: Record<string, Property | Model>): void {
		Object.entries(data).forEach(([key, value]) => {
			this.items.set(key, { type, definition: value });
		});
	}

	getDefinition(key: string, type?: PropertyType): Property | Model | undefined {
		const item = this.items.get(key);
		if (!item) return undefined;
		if (type && item.type !== type) return undefined;
		return item.definition;
	}

	getAllDefinitions(): Map<string, LibraryItem> {
		return new Map(this.items);
	}
}

function mergeProperties<T extends Property>(original: T, resolved: Property): T {
	if (isPropertyReference(resolved)) {
		return { ...original };
	}

	const merged = { ...resolved, ...original } as T;

	if (isObject(original) && isObject(resolved)) {
		(merged as ObjectProperty).properties = original.properties || resolved.properties;
	} else if (isArray(original) && isArray(resolved)) {
		(merged as ArrayProperty).itemType = original.itemType || resolved.itemType;
	} else if (isGroup(original) && isGroup(resolved)) {
		(merged as GroupProperty).itemTypes = original.itemTypes || resolved.itemTypes;
	}

	return merged;
}

export function resolveRefs(
	property: Property,
	library: UnifiedLibrary,
	resolvedRefs: Set<string> = new Set()
): Property {
	if (isPropertyReference(property)) {
		if (resolvedRefs.has(property.ref)) {
			console.warn(`Circular reference detected: ${property.ref}`);
			return property;
		}
		resolvedRefs.add(property.ref);

		const resolved = library.getDefinition(property.ref, property.type);
		if (resolved) {
			return mergeProperties(property, resolveRefs(resolved, library, resolvedRefs));
		} else {
			console.warn(`Failed to resolve ref: ${property.ref}`);
			return property;
		}
	}

	if (isObject(property)) {
		return {
			...property,
			properties: property.properties.map((p) => resolveRefs(p, library, new Set(resolvedRefs))),
		};
	}

	if (isArray(property)) {
		return {
			...property,
			itemType: resolveRefs(property.itemType, library, new Set(resolvedRefs)),
		};
	}

	if (isGroup(property)) {
		return {
			...property,
			itemTypes: property.itemTypes.map((p) => resolveRefs(p, library, new Set(resolvedRefs))),
		};
	}

	return property;
}
