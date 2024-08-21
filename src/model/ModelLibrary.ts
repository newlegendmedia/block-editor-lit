import {
	Model,
	ModelType,
	ElementModel,
	ObjectModel,
	ArrayModel,
	GroupModel,
	ModelReference,
	isObject,
	isArray,
	isGroup,
	isModelReference,
} from './model';

// Import JSON data
import objectsData from './objects.json';
import elementsData from './elements.json';
import arraysData from './arrays.json';
import groupsData from './groups.json';

interface LibraryItem {
	type: ModelType;
	definition: Model;
}

export class ModelLibrary {
	private items: Map<string, LibraryItem> = new Map();
	private errors: string[] = [];

	constructor() {
		this.loadAllData();
	}

	private loadAllData(): void {
		this.loadDefinitions(
			'object',
			objectsData as Record<string, ObjectModel | ModelReference>
		);
		this.loadDefinitions(
			'element',
			elementsData as Record<string, ElementModel | ModelReference>
		);
		this.loadDefinitions(
			'array',
			arraysData as Record<string, ArrayModel | ModelReference>);
		this.loadDefinitions(
			'group',
			groupsData as Record<string, GroupModel | ModelReference>);

		if (this.errors.length > 0) {
			console.error('Model Library: Errors found while loading library data:');
			this.errors.forEach((error) => console.error(error));
		}
	}

	private loadDefinitions(type: ModelType, data: Record<string, Model | Model>): void {
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

	getDefinition(key: string, type?: ModelType): Model | Model | undefined {
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
		item.definition = resolveRefs(item.definition, this);
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

function mergeProperties<T extends Model>(original: T, resolved: Model): T {
	if (isModelReference(original)) {
		const { ref, ...restOriginal } = original; // Exclude 'ref' from original
		original = restOriginal as T;
	}
	const merged = { ...resolved, ...original } as T;

	return merged;
}

export function resolveRefs(
	property: Model,
	library: ModelLibrary,
	resolvedRefs: Set<string> = new Set()
): Model {
	if (isModelReference(property)) {
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
		let resolvedItemTypes: (Model | ModelReference)[];
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