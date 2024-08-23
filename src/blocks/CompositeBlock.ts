import { TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { BaseBlock } from './BaseBlock';
import { contentStore } from '../content/ContentStore';
import { CompositeContent } from '../content/content';
import {
	Model,
	CompositeModel,
	isCompositeModel,
	isIndexedComposite,
	isObject,
	isArray,
	isGroup,
} from '../model/model';
import type { CompositeType } from '../model/model';

type KeyedChildren = Record<string, string>;
type IndexedChildren = string[];

export abstract class CompositeBlock<T extends CompositeType> extends BaseBlock {
	@property({ type: Object }) childBlocks: T extends 'keyed' ? KeyedChildren : IndexedChildren =
		{} as any;
	@state() protected compositeType: CompositeType = 'keyed';

	connectedCallback(): void {
		super.connectedCallback();
		this.initializeChildBlocks();
	}

	private initializeChildBlocks() {
		if (!this.content || !this.model) return;

		if (!isCompositeModel(this.model)) {
			console.error('Model is not a composite model:', this.model);
			return;
		}

		if (isIndexedComposite(this.model)) {
			this.compositeType = 'indexed';
		} else {
			this.compositeType = 'keyed';
		}

		this.childBlocks = {} as any;
		if (this.compositeType === 'keyed') {
			this.initializeKeyedChildren(this.content as CompositeContent, this.model);
		} else {
			this.initializeIndexedChildren(this.content as CompositeContent);
		}

		this.content.content = this.childBlocks;
		contentStore.setBlock(this.content as CompositeContent);
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

	protected addChildBlock(itemType: Model, key: T extends 'keyed' ? string : number) {
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
