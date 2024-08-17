import {
	Model,
	Property,
	PropertyType,
	ElementProperty,
	ObjectProperty,
	ArrayProperty,
	GroupProperty,
	PropertyReference,
	isObject,
	isArray,
	isGroup,
	isPropertyReference,
} from '../util/model';

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
	private errors: string[] = [];

	constructor() {
		this.loadAllData();
	}

	private loadAllData(): void {
		this.loadDefinitions('object', modelsData as Record<string, Property>);
		this.loadDefinitions('element', elementsData as Record<string, ElementProperty>);
		this.loadDefinitions('array', arraysData as Record<string, ArrayProperty>);
		this.loadDefinitions('group', groupsData as Record<string, GroupProperty>);

		if (this.errors.length > 0) {
			console.error('Model Library: Errors found while loading library data:');
			this.errors.forEach((error) => console.error(error));
		}
	}

	private loadDefinitions(type: PropertyType, data: Record<string, Property | Model>): void {
		Object.entries(data).forEach(([key, value]) => {
			if (!value.type) {
				this.errors.push(`Missing type for definition: ${key}`);
			} else if (value.type !== type) {
				this.errors.push(
					`Type mismatch for definition ${key}: expected ${type}, got ${value.type}`
				);
			} else {
				this.items.set(key, { type, definition: value });
			}
		});
	}

	getDefinition(key: string, type?: PropertyType): Property | Model | undefined {
		const item = this.items.get(key);
		if (!item) {
			this.errors.push(
				`Model Library: Definition not found: { type: '${type}' } with { key: '${key}' }`
			);
			return undefined;
		}
		if (type && item.type !== type) {
			this.errors.push(
				`Model Library: Type mismatch for ${key}: expected ${type}, got ${item.type}`
			);
			return undefined;
		}
		return item.definition;
	}

	getAllDefinitions(): Map<string, LibraryItem> {
		return new Map(this.items);
	}

	getErrors(): string[] {
		return [...this.errors];
	}

	clearErrors(): void {
		this.errors = [];
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
	property: Property | PropertyReference,
	library: UnifiedLibrary,
	resolvedRefs: Set<string> = new Set()
): Property | PropertyReference {
	if (isPropertyReference(property)) {
		if (resolvedRefs.has(property.ref)) {
			library
				.getErrors()
				.push(`Model Library: ResolveRefs - Circular reference detected: ${property.ref}`);
			return property;
		}
		resolvedRefs.add(property.ref);

		const resolved = library.getDefinition(property.ref, property.type);
		if (resolved) {
			return mergeProperties(property, resolveRefs(resolved, library, resolvedRefs));
		} else {
			library
				.getErrors()
				.push(`Model Library: ResolveRefs - Failed to resolve ref: ${property.ref}`);
			return property;
		}
	}

	if (isGroup(property)) {
		let resolvedItemTypes: (Property | PropertyReference)[];
		if (Array.isArray(property.itemTypes)) {
			resolvedItemTypes = property.itemTypes.map((item) =>
				resolveRefs(item, library, new Set(resolvedRefs))
			);
		} else {
			const resolvedRef = resolveRefs(property.itemTypes, library, new Set(resolvedRefs));
			if (isGroup(resolvedRef)) {
				resolvedItemTypes = Array.isArray(resolvedRef.itemTypes)
					? resolvedRef.itemTypes
					: [resolvedRef.itemTypes];
			} else {
				library
					.getErrors()
					.push(
						`Model Library: ResolveRefs - Invalid itemTypes reference: ${JSON.stringify(
							property.itemTypes
						)}. Must refer to a group.`
					);
				return property;
			}
		}
		return {
			...property,
			itemTypes: resolvedItemTypes,
		};
	}

	if (isObject(property)) {
		return {
			...property,
			properties: property.properties.map((prop) =>
				resolveRefs(prop, library, new Set(resolvedRefs))
			),
		};
	}

	if (isArray(property)) {
		return {
			...property,
			itemType: resolveRefs(property.itemType, library, new Set(resolvedRefs)),
		};
	}

	return property;
}
