import { BaseBlock } from './BaseBlock';
import { Content, KeyedCompositeContent } from '../content/content';
import { CompositeModel, Model } from '../model/model';
import { contentStore } from '../content/ContentStore';
import { ContentFactory } from '../content/ContentFactory';

export abstract class KeyedCompositeBlock extends BaseBlock {
	protected inlineChildren: boolean = false;

	protected abstract getModelProperties(): Model[];
	protected abstract getDefaultValue(prop: Model): any;

	protected async initializeBlock() {
		await super.initializeBlock();
		await this.initializeChildBlocks();
	}

	protected async initializeChildBlocks(): Promise<void> {
		this.inlineChildren = (this.model as CompositeModel).inlineChildren || false;
		this.inlineChildren ? await this.initializeInlineChildren() : await this.initializeChildren();
	}

	private async initializeChildren(): Promise<void> {
		const keyedContent = this.content?.content as KeyedCompositeContent;

		for (const prop of this.getModelProperties()) {
			if (!keyedContent[prop.key]) {
				const childContent = await this.initializeChildContent(prop);
				keyedContent[prop.key] = childContent.id;
			}
		}
	}

	private async initializeInlineChildren(): Promise<void> {
		const initialContent: KeyedCompositeContent = {};
		const keyedContent = this.content?.content as KeyedCompositeContent;

		for (const prop of this.getModelProperties()) {
			if (!prop.key) continue;
			initialContent[prop.key] = keyedContent[prop.key] ?? this.getDefaultValue(prop);
		}

		// await this.updateContent((currentContent) => ({
		// 	...currentContent,
		// 	content: this.inlineChildren ? initialContent : updatedContent,
		// 	children: this.inlineChildren ? [] : compositeContent.children,
		// }));
	}

	private async initializeChildContent(prop: Model): Promise<Content> {
		const existingChildId = (this.content?.content as KeyedCompositeContent)?.[prop.key!];

		if (existingChildId) {
			const existingContent = await contentStore.get(existingChildId);
			if (existingContent) return existingContent;
		}

		const { modelInfo, modelDefinition, content } = ContentFactory.createContentFromModel(prop);
		if (!modelDefinition) throw new Error('Model definition not found');

		return contentStore.create(
			modelInfo,
			modelDefinition,
			content as KeyedCompositeContent,
			this.content?.id,
			this.getChildPath(prop.key!)
		);
	}
}
