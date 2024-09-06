import { ModelSchema } from './ModelStore';

export class SchemaStorage {
  static async loadSchema(schemaName: string): Promise<ModelSchema | undefined> {
    const schemaJson = localStorage.getItem(`schema:${schemaName}`);
    return schemaJson ? JSON.parse(schemaJson) : undefined;
  }

  static async saveSchema(schema: ModelSchema): Promise<void> {
    localStorage.setItem(`schema:${schema.name}`, JSON.stringify(schema));
  }

  static async loadSchemaFromJson(jsonData: any, schemaName: string): Promise<void> {
    const schema: ModelSchema = {
      name: schemaName,
      models: jsonData
    };
    await this.saveSchema(schema);
  }
}