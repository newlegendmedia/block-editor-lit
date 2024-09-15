import { BaseBlock } from './BaseBlock';
import { Content, CompositeContent, KeyedCompositeContent } from '../content/content';
import { CompositeModel, Model } from '../model/model';
import { contentStore } from '../resourcestore';
import { ContentFactory } from '../store/ContentFactory';

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
		await this.initializeChildren();
	}

	private async initializeChildren(): Promise<void> {
		const initialContent: KeyedCompositeContent = {};
		const compositeContent = this.content as CompositeContent;

		if (!Array.isArray(compositeContent.children)) {
			compositeContent.children = [];
		}

		const updatedContent = this.getUpdatedContent(compositeContent);

		for (const prop of this.getModelProperties()) {
			if (!prop.key) continue;

			const existingValue = updatedContent[prop.key];

			if (this.inlineChildren) {
				initialContent[prop.key] = existingValue ?? this.getDefaultValue(prop);
			} else {
				let childContentId = existingValue;

				if (!childContentId) {
					const childContent = await this.initializeChildContent(prop);
					childContentId = childContent.id;
					compositeContent.children.push(childContentId);
					updatedContent[prop.key] = childContentId;
				}
			}
		}

		await this.updateContent((currentContent) => ({
			...currentContent,
			content: this.inlineChildren ? initialContent : updatedContent,
			children: this.inlineChildren ? [] : compositeContent.children,
		}));
	}

	private getUpdatedContent(compositeContent: CompositeContent): KeyedCompositeContent {
		return typeof compositeContent.content === 'string'
			? JSON.parse(compositeContent.content)
			: (compositeContent.content as KeyedCompositeContent) || {};
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
			this.contentId
		);
	}

	protected async removeChildBlock(key: string): Promise<void> {
		if (!this.content) return;

		const contentData = this.content.content as KeyedCompositeContent;
		const childId = contentData[key];

		delete contentData[key];

		if (!this.inlineChildren && childId) {
			await contentStore.delete(childId);
			const updatedContent = this.content as CompositeContent;
			updatedContent.children = updatedContent.children.filter((id) => id !== childId);
		}

		await this.updateContent((currentContent) => ({
			...currentContent,
			content: contentData,
		}));
	}

	protected getChildPath(childKey: string): string {
		return `${this.path}.${childKey}`;
	}

	protected getChildBlockId(childKey: string): string | undefined {
		const contentData = this.content?.content as KeyedCompositeContent;
		const childContent = contentData?.[childKey];
		return this.inlineChildren && typeof childContent !== 'string' ? undefined : childContent;
	}
}
