import {
	ModelInfo,
	Content,
	ElementContent,
	CompositeContent,
} from '../content/content';
import {
	AtomType,
	ObjectModel,
	ArrayModel,
	GroupModel,
	ElementModel,
	isElement,
	isObject,
	isArray,
	isGroup,
	Model,
} from '../model/model';

export class ContentFactory {
	static createContentFromModel(model: Model): Omit<Content, 'id'> {
		const modelInfo: ModelInfo = {
			type: model.type,
			key: model.key,
			ref: 'ref' in model ? model.ref : undefined,
		};

		if (isElement(model)) {
			return createElementContent(model, modelInfo);
		} else if (isObject(model)) {
			return createObjectContent(model, modelInfo);
		} else if (isArray(model)) {
			return createArrayContent(model, modelInfo);
		} else if (isGroup(model)) {
			return createGroupContent(model, modelInfo);
		}
		console.error(`Unsupported model type: ${model.type}`, model);
		throw new Error(`Unsupported model type: ${model.type}`);

		function createElementContent(
			model: ElementModel,
			modelInfo: Content['modelInfo']
		): Omit<ElementContent, 'id'> {
			let defaultValue: any;

			switch (model.base) {
				case AtomType.Boolean:
					defaultValue = false;
					break;
				case AtomType.Number:
					defaultValue = 0;
					break;
				case AtomType.Text:
				case AtomType.Enum:
				case AtomType.File:
				case AtomType.Reference:
					defaultValue = 'Hello World';
					break;
				case AtomType.Datetime:
					defaultValue = new Date().toISOString();
					break;
				default:
					defaultValue = null;
			}

			return {
				modelInfo,
				modelDefinition: model,
				content: defaultValue,
			};
		}

		function createObjectContent(
			model: ObjectModel,
			modelInfo: Content['modelInfo']
		): Omit<CompositeContent, 'id'> {
			const childContent: Record<string, string> = {};
			const children: string[] = [];

			return {
				modelInfo,
				modelDefinition: model,
				content: childContent,
				children,
			};
		}

		function createArrayContent(
			model: ArrayModel,
			modelInfo: Content['modelInfo']
		): Omit<CompositeContent, 'id'> {
			return {
				modelInfo,
				modelDefinition: model,
				content: [],
				children: [],
			};
		}

		function createGroupContent(
			model: GroupModel,
			modelInfo: Content['modelInfo']
		): Omit<CompositeContent, 'id'> {
			return {
				modelInfo,
				modelDefinition: model,
				content: [],
				children: [],
			};
		}
	}
}
