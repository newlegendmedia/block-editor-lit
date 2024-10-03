import {
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
		if (isElement(model)) {
			return this.createElementContent(model);
		} else if (isObject(model)) {
			return this.createObjectContent(model);
		} else if (isArray(model)) {
			return this.createArrayContent(model);
		} else if (isGroup(model)) {
			return this.createGroupContent(model);
		}
		console.error(`Unsupported model type: ${model.type}`, model);
		throw new Error(`Unsupported model type: ${model.type}`);
	}

	private static createElementContent(model: ElementModel): Omit<ElementContent, 'id'> {
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
			key: model.key,
			type: model.type,
			content: defaultValue,
		};
	}

	private static createObjectContent(model: ObjectModel): Omit<ObjectContent, 'id'> {
		const childContent: Record<string, ContentId> = {};
		const children: KeyedCompositeChildren = {};

		model.properties.forEach((propertyModel) => {
			const childId = generateId(propertyModel.type.slice(0, 3).toUpperCase()) as ContentId;
			const childContentItem = this.createContentFromModel(propertyModel) as Omit<Content, 'id'>;

			childContent[propertyModel.key] = childId;
			children[propertyModel.key] = {
				id: childId,
				...childContentItem,
			};
		});

		const newContent = {
			key: model.key,
			type: model.type,
			content: childContent,
			children,
		};
		return newContent;
	}

	private static createArrayContent(model: ArrayModel): Omit<CompositeContent, 'id'> {
		return {
			key: model.key,
			type: model.type,
			content: [],
			children: [] as IndexedCompositeChildren,
		};
	}

	private static createGroupContent(model: GroupModel): Omit<CompositeContent, 'id'> {
		return {
			key: model.key,
			type: model.type,
			content: [],
			children: [] as IndexedCompositeChildren,
		};
	}
}
