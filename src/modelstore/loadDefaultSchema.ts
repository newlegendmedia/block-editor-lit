import { SchemaStorage } from "./SchemaStorage";
import { DEFAULT_SCHEMA_NAME } from "./constants";
import { ModelSchema, ModelWithoutId } from "../model/model";

import objectsData from "../model/objects.json";
import elementsData from "../model/elements.json";
import arraysData from "../model/arrays.json";
import groupsData from "../model/groups.json";
import { modelStore } from "./ModelStoreInstance";

export async function loadDefaultSchema(): Promise<void> {
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
      console.error("Error loading schema from JSON:", error);
    }
  } catch (error) {
    console.error(
      `Error loading default schema '${DEFAULT_SCHEMA_NAME}':`,
      error,
    );
    console.error("Schema data that caused the error:", defaultSchemaData);
    throw error;
  }
}
