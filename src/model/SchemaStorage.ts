// SchemaStorage.ts

import { modelStore } from './ModelStore';
import { ModelSchema, ModelWithoutId } from './model';

import arraysData from './files/arrays.json';
import elementsData from './files/elements.json';
import groupsData from './files/groups.json';
import objectsData from './files/objects.json';

export const DEFAULT_SCHEMA_NAME = 'default';

export class SchemaStorage {
	static async loadSchema(schemaName: string): Promise<ModelSchema | undefined> {
		const schemaJson = localStorage.getItem(`schema:${schemaName}`);
		return schemaJson ? JSON.parse(schemaJson) : undefined;
	}

	static async saveSchema(schema: ModelSchema): Promise<void> {
		localStorage.setItem(`schema:${schema.name}`, JSON.stringify(schema));
	}

	static async loadSchemaFromJson(schema: ModelSchema): Promise<void> {
		await this.saveSchema(schema);
	}

	static async loadDefaultSchema(): Promise<void> {
		const defaultSchemaData: ModelSchema = {
			name: DEFAULT_SCHEMA_NAME,
			models: {
				object: objectsData as Record<string, ModelWithoutId>,
				element: elementsData as Record<string, ModelWithoutId>,
				array: arraysData as Record<string, ModelWithoutId>,
				group: groupsData as Record<string, ModelWithoutId>,
			},
		};

		try {
			try {
				await SchemaStorage.loadSchemaFromJson(defaultSchemaData);
				await modelStore.loadSchema(DEFAULT_SCHEMA_NAME);
			} catch (error) {
				console.error('Error loading schema from JSON:', error);
			}
		} catch (error) {
			console.error(`Error loading default schema '${DEFAULT_SCHEMA_NAME}':`, error);
			console.error('Schema data that caused the error:', defaultSchemaData);
			throw error;
		}
	}
}
