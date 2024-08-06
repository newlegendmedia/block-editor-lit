import { ModelDefinition, AtomType } from '../types/ModelDefinition';

export class ModelLibrary {
  private models: Map<string, ModelDefinition>;

  constructor() {
    this.models = new Map();
    this.initializeModels();
  }

  private initializeModels() {
    // ... other models ...

    const documentModel: ModelDefinition = {
      key: 'document',
      label: 'Document',
      type: 'model',
      properties: [
        {
          type: 'element',
          key: 'title',
          label: 'Document Title',
          atom: AtomType.Text
        },
        {
          type: 'group',
          key: 'content',
          label: 'Document Content',
          properties: [
            {
              type: 'list',
              key: 'sections',
              label: 'Sections',
              items: {
                type: 'model',
                key: 'section',
                label: 'Section',
                properties: [
                  {
                    type: 'element',
                    key: 'heading',
                    label: 'Section Heading',
                    atom: AtomType.Text
                  },
                  {
                    type: 'element',
                    key: 'body',
                    label: 'Section Body',
                    atom: AtomType.Text
                  }
                ]
              }
            }
          ]
        },
        {
          type: 'model',
          key: 'metadata',
          label: 'Document Metadata',
          properties: [
            {
              type: 'element',
              key: 'author',
              label: 'Author',
              atom: AtomType.Text
            },
            {
              type: 'element',
              key: 'createdAt',
              label: 'Created At',
              atom: AtomType.Datetime
            }
          ]
        }
      ]
    };

    this.models.set('document', documentModel);
  }

  getModel(key: string): ModelDefinition | undefined {
    return this.models.get(key);
  }

  // New method to get all available model keys
  getAvailableModels(): string[] {
    return Array.from(this.models.keys());
  }

  // New method to add a custom model
  addModel(model: ModelDefinition): void {
    if (this.models.has(model.key)) {
      console.warn(`Model with key ${model.key} already exists. Overwriting.`);
    }
    this.models.set(model.key, model);
  }
}