// loadDefaultSchema.ts

import { SchemaStorage } from './SchemaStorage';
import { DEFAULT_SCHEMA_NAME } from './constants';
import { ModelSchema } from './ModelStore';
import { Model } from '../model/model';

import objectsData from '../model/objects.json';
import elementsData from '../model/elements.json';
import arraysData from '../model/arrays.json';
import groupsData from '../model/groups.json';
import { modelStore } from './ModelStoreInstance';

// function addIdsToModels(models: Record<string, any>): Record<string, Model> {
//   return Object.fromEntries(
//     Object.entries(models).map(([key, model]) => [
//       key,
//       { 
//         ...model, 
//         id: model.id || `${model.type}.${model.key}` // Use existing id if available, otherwise generate one
//       }
//     ])
//   );
// }

export async function loadDefaultSchema(): Promise<void> {
  const defaultSchemaData: ModelSchema = {
    name: DEFAULT_SCHEMA_NAME,
    models: {
      object: objectsData as Record<string, Model>,
      element: elementsData as Record<string, Model>,
      array: arraysData as Record<string, Model>,
      group: groupsData as Record<string, Model>,
    }
  };

  // Log the Notion model to verify it's present
  if(defaultSchemaData.models.object)

  try {
    try {
      await SchemaStorage.loadSchemaFromJson(defaultSchemaData);
      await modelStore.loadSchema(DEFAULT_SCHEMA_NAME);
      
      // Log all object models to verify 'notion' is present
//      console.log('Loaded object models:', Object.keys(defaultSchemaData.models.object));
      
    } catch (error) {
      // ... error handling ...
    }
  } catch (error) {
    console.error(`Error loading default schema '${DEFAULT_SCHEMA_NAME}':`, error);
    console.error('Schema data that caused the error:', defaultSchemaData);
    throw error;
  }
}

