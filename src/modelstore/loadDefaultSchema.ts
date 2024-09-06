import { SchemaStorage } from './SchemaStorage';
import { DEFAULT_SCHEMA_NAME } from './constants';

// Import JSON data
import objectsData from '../model/objects.json';
import elementsData from '../model/elements.json';
import arraysData from '../model/arrays.json';
import groupsData from '../model/groups.json';

export async function loadDefaultSchema(): Promise<void> {
  const defaultSchemaData = {
    objects: objectsData,
    elements: elementsData,
    arrays: arraysData,
    groups: groupsData,
  };

  ;

  try {
    await SchemaStorage.loadSchemaFromJson(defaultSchemaData, DEFAULT_SCHEMA_NAME);
    ;
  } catch (error) {
    console.error(`Error loading default schema '${DEFAULT_SCHEMA_NAME}':`, error);
    console.error('Schema data that caused the error:', defaultSchemaData);
    throw error;
  }
}