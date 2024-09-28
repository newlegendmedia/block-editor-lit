import {
	ModelInfo,
	Content,
	ElementContent,
	CompositeContent,
	KeyedCompositeChildren,
	IndexedCompositeChildren,
	ContentId,
	ObjectContent,
} from './content';
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
import { generateId } from '../util/generateId';

export class ContentFactory {
	static createContentFromModel(model: Model): Omit<Content, 'id'> {
		const modelInfo: ModelInfo = {
			type: model.type,
			key: model.key,
			ref: 'ref' in model ? model.ref : undefined,
		};

		if (isElement(model)) {
			return this.createElementContent(model, modelInfo);
		} else if (isObject(model)) {
			return this.createObjectContent(model, modelInfo);
		} else if (isArray(model)) {
			return this.createArrayContent(model, modelInfo);
		} else if (isGroup(model)) {
			return this.createGroupContent(model, modelInfo);
		}
		console.error(`Unsupported model type: ${model.type}`, model);
		throw new Error(`Unsupported model type: ${model.type}`);
	}

	private static createElementContent(
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
				defaultValue = '';
				break;
			case AtomType.Datetime:
				defaultValue = new Date().toISOString();
				break;
			default:
				defaultValue = null;
		}

		return {
			modelInfo,
			content: defaultValue,
		};
	}

	private static createObjectContent(
		model: ObjectModel,
		modelInfo: Content['modelInfo']
	): Omit<ObjectContent, 'id'> {
		const childContent: Record<string, ContentId> = {};
		const children: KeyedCompositeChildren = {};

		model.properties.forEach((propertyModel) => {
			const childId = generateId(propertyModel.type.slice(0, 3).toUpperCase()) as ContentId;
			const childContentItem = this.createContentFromModel(propertyModel) as Omit<Content, 'id'>;

			childContent[propertyModel.key] = childId;
			children[propertyModel.key] = {
				id: childId,
				key: propertyModel.key,
				type: propertyModel.type,
				...childContentItem,
			};
		});

		const newContent = {
			modelInfo,
			content: childContent,
			children,
		};
		return newContent;
	}

	private static createArrayContent(
		_model: ArrayModel,
		modelInfo: Content['modelInfo']
	): Omit<CompositeContent, 'id'> {
		return {
			modelInfo,
			content: [],
			children: [] as IndexedCompositeChildren,
		};
	}

	private static createGroupContent(
		_model: GroupModel,
		modelInfo: Content['modelInfo']
	): Omit<CompositeContent, 'id'> {
		return {
			modelInfo,
			content: [],
			children: [] as IndexedCompositeChildren,
		};
	}
}
