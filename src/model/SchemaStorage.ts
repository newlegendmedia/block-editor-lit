// SchemaStorage.ts

import { schemaManager } from './SchemaManager';
import {
	ArrayModelDefn,
	ArrayModelRefDefn,
	ElementModelDefn,
	ElementModelRefDefn,
	GroupModelDefn,
	GroupModelRefDefn,
	ObjectModelDefn,
	ObjectModelRefDefn,
} from './types/modelDefn';
import { ModelSchema } from './types/modelSchema';

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
				root: {},
				object: objectsData as Record<string, ObjectModelDefn | ObjectModelRefDefn>,
				element: elementsData as Record<string, ElementModelDefn | ElementModelRefDefn>,
				array: arraysData as Record<string, ArrayModelDefn | ArrayModelRefDefn>,
				group: groupsData as Record<string, GroupModelDefn | GroupModelRefDefn>,
			},
		};

		try {
			try {
				await SchemaStorage.loadSchemaFromJson(defaultSchemaData);
				await schemaManager.loadSchema(DEFAULT_SCHEMA_NAME, defaultSchemaData);
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
