import { Content, ElementContent, CompositeContent, ContentId, ObjectContent } from './content';
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
import { TreeNode } from '../tree/TreeNode';

export class ContentFactory {
	static createContentFromModel(
		model: Model,
		parentId: string | null = null
	): Omit<Content, 'id'> & Partial<TreeNode> {
		if (isElement(model)) {
			return this.createElementContent(model, parentId);
		} else if (isObject(model)) {
			return this.createObjectContent(model, parentId);
		} else if (isArray(model)) {
			return this.createArrayContent(model, parentId);
		} else if (isGroup(model)) {
			return this.createGroupContent(model, parentId);
		}
		console.error(`Unsupported model type: ${model.type}`, model);
		throw new Error(`Unsupported model type: ${model.type}`);
	}

	private static createElementContent(
		model: ElementModel,
		parentId: string | null
	): Omit<ElementContent, 'id'> & Partial<TreeNode> {
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
			parentId: parentId,
			children: [],
		};
	}

	private static createObjectContent(
		model: ObjectModel,
		parentId: string | null
	): Omit<ObjectContent, 'id'> & Partial<TreeNode> {
		const childContent: Record<string, ContentId> = {};
		const children: ContentId[] = [];

		model.properties.forEach((propertyModel) => {
			this.createContentFromModel(propertyModel, parentId) as Omit<Content, 'id'>;
			// const childId = generateId(propertyModel.type.slice(0, 3).toUpperCase()) as ContentId;
			// childContent[propertyModel.key] = childId;
			// children.push(childId);
		});

		return {
			key: model.key,
			type: model.type,
			content: childContent,
			children,
			parentId: parentId,
		};
	}

	private static createArrayContent(
		model: ArrayModel,
		parentId: string | null
	): Omit<CompositeContent, 'id'> & Partial<TreeNode> {
		return {
			key: model.key,
			type: model.type,
			content: [],
			children: [],
			parentId: parentId,
		};
	}

	private static createGroupContent(
		model: GroupModel,
		parentId: string | null
	): Omit<CompositeContent, 'id'> & Partial<TreeNode> {
		return {
			key: model.key,
			type: model.type,
			content: [],
			children: [],
			parentId: parentId,
		};
	}
}
