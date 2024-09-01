// KeyedCompositeBlock.ts
import { CompositeBlock, KeyedChildren } from './CompositeBlock';
import { Content, ContentId, CompositeContent, KeyedCompositeContent } from '../content/content';
import { CompositeModel, isCompositeModel, isElement, Model } from '../model/model';
import { contentStore } from '../store';
import { ContentFactory } from '../store/ContentFactory';

export abstract class KeyedCompositeBlock extends CompositeBlock<'keyed'> {
  protected inlineChildren: boolean = false;

  protected syncChildrenWithContent(): void {
    if (!this.content) return;
    
    const compositeContent = this.content as CompositeContent;
    const keyedContent: KeyedCompositeContent = {};
    
    for (const [key, value] of Object.entries(this.childBlocks)) {
      keyedContent[key] = value;
    }

    compositeContent.content = keyedContent;
    compositeContent.children = this.inlineChildren ? [] : Object.values(this.childBlocks as KeyedChildren);
  }

  protected async initializeChildBlocks(): Promise<void> {
    if (!this.content || !this.model) return;

    this.inlineChildren = (this.model as CompositeModel).inlineChildren || false;

    if (this.inlineChildren) {
      await this.initializeInlineChildren();
    } else {
      await this.initializeKeyedChildren(this.content as CompositeContent, this.model as CompositeModel);
    }

    await this.updateChildStructure();
  }

  protected initializeIndexedChildren(): void {
    throw new Error('Keyed composites do not support indexed children');
  }

  protected abstract useInlineChildren(): boolean;

  private async initializeInlineChildren(): Promise<void> {
    if (!this.model || !isCompositeModel(this.model)) return;

    const initialContent: KeyedCompositeContent = {};

    for (const prop of this.getModelProperties()) {
      if (prop.key) {
        if (isElement(prop)) {
          const existingValue = (this.content?.content as KeyedCompositeContent)?.[prop.key];
          initialContent[prop.key] = existingValue !== undefined ? existingValue : this.getDefaultValue(prop);
        } else {
          const childContent = await this.initializeNonElementChild(prop);
          initialContent[prop.key] = childContent.id;
        }
      }
    }

    await this.updateContent(content => ({
      ...content,
      content: initialContent,
      children: [],
    }));

    this.childBlocks = initialContent;
  }

  protected abstract getModelProperties(): Model[];
  protected abstract getDefaultValue(prop: Model): any;

  private async initializeNonElementChild(prop: Model): Promise<CompositeContent> {
    const existingChildId = (this.content?.content as KeyedCompositeContent)?.[prop.key!];
    if (existingChildId) {
      const existingContent = await contentStore.getContent(existingChildId);
      if (existingContent) {
        return existingContent as CompositeContent;
      }
    }
    const { modelInfo, modelDefinition, content } = ContentFactory.createContentFromModel(prop);
    return await contentStore.createContent(modelInfo, modelDefinition, content as KeyedCompositeContent) as CompositeContent;
  }

  protected async initializeKeyedChildren(
    compositeContent: CompositeContent,
    _model: CompositeModel
  ): Promise<void> {
    const childProperties = this.getModelProperties();
    this.childBlocks = {} as KeyedChildren;

    if (!Array.isArray(compositeContent.children)) {
      compositeContent.children = [];
    }

    let updatedContent: KeyedCompositeContent = 
      typeof compositeContent.content === 'string' ? 
        JSON.parse(compositeContent.content) : 
        compositeContent.content as KeyedCompositeContent;

    for (const prop of childProperties) {
      if (prop.key) {
        let childContentId = updatedContent[prop.key];

        if (!childContentId) {
          const { modelInfo, modelDefinition, content } = ContentFactory.createContentFromModel(prop);
          const childBlock = await contentStore.createContent(modelInfo, modelDefinition, content);
          childContentId = childBlock.id;
          compositeContent.children.push(childContentId);
        }

        (this.childBlocks as KeyedChildren)[prop.key] = childContentId;
        updatedContent[prop.key] = childContentId;
      }
    }

    await this.updateContent((currentContent: Content): CompositeContent => ({
      ...currentContent,
      content: updatedContent,
      children: compositeContent.children
    }));
  }

  protected async addChildBlock(itemType: Model, key: string): Promise<ContentId> {
    if (this.inlineChildren && isElement(itemType)) {
      (this.childBlocks as Record<string, any>)[key] = this.getDefaultValue(itemType);
      await this.updateChildStructure();
      return 'inline:' + this.contentId + ':' + key;
    }

    const { modelInfo, modelDefinition, content } = ContentFactory.createContentFromModel(itemType);
    const newChildContent = await contentStore.createContent(modelInfo, modelDefinition, content);
    const newChildId = newChildContent.id;

    if (!this.content) {
      throw new Error('Content is not initialized');
    }

    if (isCompositeModel(itemType)) {
      (newChildContent as CompositeContent).children = [];
      newChildContent.content = {};
    }

    (this.childBlocks as KeyedChildren)[key] = newChildId;
    (this.content.content as KeyedCompositeContent)[key] = newChildId;

    const compositeContent = this.content as CompositeContent;
    compositeContent.children.push(newChildId);

    await this.updateChildStructure();
    return newChildId;
  }

  protected async removeChildBlock(key: string): Promise<void> {
    if (this.inlineChildren) {
      delete (this.childBlocks as Record<string, any>)[key];
      await this.updateChildStructure();
      return;
    }

    const childId = (this.childBlocks as KeyedChildren)[key];
    if (childId) {
      delete (this.childBlocks as KeyedChildren)[key];
      await this.updateChildStructure();
      await contentStore.deleteContent(childId);
    }
  }

  protected getChildPath(childKey: string): string {
    return `${this.path}.${childKey}`;
  }

  protected getChildBlockId(childKey: string): string | undefined {
    if (this.inlineChildren) {
      const childContent = (this.content?.content as KeyedCompositeContent)?.[childKey];
      return typeof childContent === 'string' ? childContent : undefined;
    }
    return this.childBlocks[childKey as string];
  }
}