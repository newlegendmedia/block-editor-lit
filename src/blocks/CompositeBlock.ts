import { TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { BaseBlock } from './BaseBlock';
import { contentStore } from '../content/ContentStore';
import { CompositeContent, ContentId } from '../content/content';
import {
	Model,
	CompositeModel,
	isKeyedComposite,
	isIndexedComposite,
	isObject,
	isArray,
	isGroup,
	isElement,
} from '../model/model';
import type { CompositeType } from '../model/model';

type KeyedChildren = Record<string, string>;
type IndexedChildren = string[];
type MixedKeyedChildren = Record<string, string | any>;

export abstract class CompositeBlock<T extends CompositeType> extends BaseBlock {
	@property({ type: Object })
	childBlocks!: T extends 'keyed' ? KeyedChildren | MixedKeyedChildren : IndexedChildren;

	@state() protected compositeType: CompositeType = 'keyed';
	@property({ type: Boolean }) inlineChildren: boolean = false;

	constructor() {
		super();
		this.childBlocks = (this.compositeType === 'keyed' ? {} : []) as T extends 'keyed'
			? KeyedChildren | MixedKeyedChildren
			: IndexedChildren;
	}

	connectedCallback(): void {
		super.connectedCallback();
		this.initializeChildBlocks();
	}

	private initializeChildBlocks() {
		if (!this.content || !this.model) return;

		if (isIndexedComposite(this.model)) {
			this.compositeType = 'indexed';
			this.initializeIndexedChildren(this.content as CompositeContent);
		} else if (isKeyedComposite(this.model)) {
			this.compositeType = 'keyed';
			if (isObject(this.model)) {
				this.inlineChildren = !!this.model?.inlineChildren;
			}	
			if (this.inlineChildren) {
				this.initializeInlineKeyedChildren(this.content as CompositeContent, this.model);
			} else {
				this.initializeKeyedChildren(this.content as CompositeContent, this.model);
			}
		} else {
			console.error('Invalid model for composite:', this.model);
			return;
		}

		this.content.content = this.childBlocks;
		contentStore.setBlock(this.content as CompositeContent);
	}

	private initializeInlineKeyedChildren(compositeBlock: CompositeContent, model: CompositeModel) {
		const childProperties = this.getChildProperties(model);
		this.childBlocks = {} as T extends 'keyed'
			? KeyedChildren | MixedKeyedChildren
			: IndexedChildren;

		childProperties.forEach((prop) => {
			if (isElement(prop)) {
				// For elements, initialize with a placeholder or default value
				(this.childBlocks as MixedKeyedChildren)[prop.key!] = null;
			} else {
				// For composites, create a content block as before
				let childContentId = compositeBlock.children.find((childId) => {
					const childBlock = contentStore.getBlock(childId);
					return childBlock && childBlock.modelInfo.key === prop.key;
				});

				if (!childContentId) {
					const childBlock = contentStore.createBlockFromModel(prop);
					childContentId = childBlock.id;
					compositeBlock.children.push(childContentId);
				}

				(this.childBlocks as MixedKeyedChildren)[prop.key!] = childContentId;
			}
		});
	}

	private initializeKeyedChildren(compositeBlock: CompositeContent, model: CompositeModel) {
		const childProperties = this.getChildProperties(model);
		childProperties.forEach((prop, index) => {
			let childContentId = compositeBlock.children[index];
			if (!childContentId) {
				const childBlock = contentStore.createBlockFromModel(prop);
				childContentId = childBlock.id;
				compositeBlock.children[index] = childContentId;
			}
			(this.childBlocks as KeyedChildren)[prop.key!] = childContentId;
		});
	}

	private initializeIndexedChildren(compositeBlock: CompositeContent) {
		this.childBlocks = compositeBlock.children as T extends 'keyed'
			? KeyedChildren
			: IndexedChildren;
	}

	private getChildProperties(model: CompositeModel): Model[] {
		if (isObject(model)) {
			return model.properties;
		} else if (isArray(model)) {
			return Array.isArray(model.itemType) ? model.itemType : [model.itemType];
		} else if (isGroup(model)) {
			return Array.isArray(model.itemTypes) ? model.itemTypes : [model.itemTypes];
		}
		return [];
	}

	protected getChildPath(childKey: string | number): string {
		if (this.compositeType === 'keyed') {
			return `${this.path}.${childKey}`;
		} else {
			return `${this.path}[${childKey}]`;
		}
	}

	protected getChildBlockId(childKey: string | number): string | undefined {
		if (this.compositeType === 'keyed') {
			return (this.childBlocks as KeyedChildren)[childKey as string];
		} else {
			return (this.childBlocks as IndexedChildren)[childKey as number];
		}
	}

    protected addChildBlock(itemType: Model, key: T extends 'keyed' ? string : number): ContentId {
        const newChildBlock = contentStore.createBlockFromModel(itemType);
        if (this.compositeType === 'keyed') {
            (this.childBlocks as KeyedChildren)[key as string] = newChildBlock.id;
        } else {
            (this.childBlocks as IndexedChildren).push(newChildBlock.id);
        }

        const compositeContent = this.content as CompositeContent;
        compositeContent.content = this.childBlocks;
        contentStore.setBlock(compositeContent);

        this.requestUpdate();

        return newChildBlock.id;
    }

	protected removeChildBlock(keyOrIndex: T extends 'keyed' ? string : number) {
		const childId = this.getChildBlockId(keyOrIndex);
		if (!childId) return;

		if (this.compositeType === 'keyed') {
			delete (this.childBlocks as KeyedChildren)[keyOrIndex as string];
		} else {
			(this.childBlocks as IndexedChildren).splice(keyOrIndex as number, 1);
		}

		const compositeContent = this.content as CompositeContent;
		compositeContent.children = this.childBlocks as IndexedChildren;
		contentStore.deleteBlock(childId);
		contentStore.setBlock(compositeContent);

		this.requestUpdate();
	}

	protected handleValueChanged(e: CustomEvent) {
		const { key, value } = e.detail;

		if (!this.content || !this.content.content) {
			return;
		}

		if (this.compositeType === 'keyed') {
			const updatedContent = { ...(this.content.content as Record<string, unknown>), [key]: value };
			this.updateBlockContent(updatedContent);
		} else {
			const indexedContent = this.content.content as unknown[];
			const index = (this.childBlocks as IndexedChildren).indexOf(key);
			if (index !== -1) {
				const updatedContent = [...indexedContent];
				updatedContent[index] = value;
				this.updateBlockContent(updatedContent);
			}
		}
	}

	abstract renderContent(): TemplateResult;
}
