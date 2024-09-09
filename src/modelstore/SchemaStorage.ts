// SchemaStorage.ts

import { ModelSchema } from './ModelStore';

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
}