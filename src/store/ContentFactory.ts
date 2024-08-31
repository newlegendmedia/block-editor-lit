import { ModelInfo, CompositeContent } from '../content/content';
import { Model, ModelType, isCompositeModel, CompositeModel, isObject, AtomType, isElement, isArray, isGroup } from '../model/model';

export class ContentFactory {
  static createContentFromModel<T = unknown>(model: Model, initialContent?: T): {
    modelInfo: ModelInfo,
    modelDefinition: Model,
    content: T extends CompositeContent ? CompositeContent : T
  } {
    const modelInfo: ModelInfo = {
      type: model.type as ModelType,
      key: model.key,
      ref: 'ref' in model ? model.ref : undefined
    };

    let content: any;

    if (isCompositeModel(model)) {
      const compositeContent = initialContent || this.createCompositeContent(model);
      content = {
        children: [],
        content: compositeContent,
      };
    } else {
      content = initialContent || this.getDefaultContent(model);
    }

    return {
      modelInfo,
      modelDefinition: model,
      content: content as T extends CompositeContent ? CompositeContent : T
    };
  }

  private static createCompositeContent(model: CompositeModel): any {
    if (isObject(model)) {
      return model.properties.reduce((acc, prop) => {
        acc[prop.key] = this.getDefaultContent(prop);
        return acc;
      }, {} as Record<string, any>);
    } else if (isArray(model)) {
      return [];
    } else if (isGroup(model)) {
      return {};
    }
    return {};
  }

  private static getDefaultContent(model: Model): any {
    if (isElement(model)) {
      switch (model.base) {
        case AtomType.Boolean:
          return false;
        case AtomType.Number:
          return 0;
        case AtomType.Datetime:
          return new Date().toISOString();
        case AtomType.Text:
        case AtomType.Enum:
        case AtomType.File:
        case AtomType.Reference:
          return '';
        default:
          console.warn(`Unknown element base type: ${model.base}`);
          return null;
      }
    } else if (isObject(model)) {
      return this.createCompositeContent(model);
    } else if (isArray(model)) {
      return [];
    } else if (isGroup(model)) {
      return {};
    } else {
      console.warn(`Unknown model type: ${model.type}`);
      return null;
    }
  }
}