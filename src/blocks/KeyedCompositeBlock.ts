import { CompositeBlock, KeyedChildren } from './CompositeBlock';
import { Content, ContentId, CompositeContent, KeyedCompositeContent } from '../content/content';
import { CompositeModel, isCompositeModel, isElement, Model } from '../model/model';
import { contentStore } from '../store';
import { ContentFactory } from '../store/ContentFactory';

export abstract class KeyedCompositeBlock extends CompositeBlock<'keyed'> {
  protected inlineChildren: boolean = false;

  async connectedCallback() {
    await super.connectedCallback();
    await this.initializeChildBlocks();
    this.requestUpdate();
  }


  protected syncChildrenWithContent(): void {
    const compositeContent = this.content as CompositeContent;
    
    // Convert childBlocks to a KeyedCompositeContent object
    const keyedContent: KeyedCompositeContent = {};
    for (const [key, value] of Object.entries(this.childBlocks)) {
      keyedContent[key] = value;
    }

    compositeContent.content = this.childBlocks;

    if (this.inlineChildren) {
      compositeContent.children = [];
    } else {
      compositeContent.children = Object.values(this.childBlocks as KeyedChildren);
    }
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
      children: [],  // Ensure children array is initialized
    }));

    this.childBlocks = initialContent;
  }

  protected abstract getModelProperties(): Model[];
  protected abstract getDefaultValue(prop: Model): any;

  private async initializeNonElementChild(prop: Model): Promise<CompositeContent> {
    const existingChildId = (this.content?.content as KeyedCompositeContent)?.[prop.key!];
    if (existingChildId) {
      console.log('[KeyedCompositeBlock] getContent for non element child:', existingChildId);
      const existingContent = await contentStore.getContent(existingChildId);
      if (existingContent) {
        return existingContent as CompositeContent;
      }
    }
    const { modelInfo, modelDefinition, content } = ContentFactory.createContentFromModel(prop);
    return await contentStore.createContent(modelInfo, modelDefinition, content) as CompositeContent;
  }

  protected async initializeKeyedChildren(
    compositeBlock: CompositeContent,
    _model: CompositeModel
  ): Promise<void> {
    const childProperties = this.getModelProperties();
    this.childBlocks = {} as KeyedChildren;

    // Ensure children array is initialized
    if (!Array.isArray(compositeBlock.children)) {
      compositeBlock.children = [];
    }

    let updatedContent: KeyedCompositeContent = {};
    
    // Parse the string content into an object
    if (typeof compositeBlock.content === 'string') {
      try {
        updatedContent = JSON.parse(compositeBlock.content);
      } catch (e) {
        console.error('Failed to parse composite content:', e);
      }
    }

    for (const prop of childProperties) {
      if (prop.key) {
        let childContentId = updatedContent[prop.key];

        if (!childContentId) {
          // If child content doesn't exist, create it
          const { modelInfo, modelDefinition, content } = ContentFactory.createContentFromModel(prop);
          const childBlock = await contentStore.createContent(modelInfo, modelDefinition, content);
          childContentId = childBlock.id;
          compositeBlock.children.push(childContentId);
        }

        (this.childBlocks as KeyedChildren)[prop.key] = childContentId;
        updatedContent[prop.key] = childContentId;
      }
    }

    // Update the content only once, after all children have been processed
    await this.updateContent((currentContent: Content): CompositeContent => {
      const updatedCompositeContent: CompositeContent = {
        id: currentContent.id,
        modelInfo: currentContent.modelInfo,
        modelDefinition: currentContent.modelDefinition,
        content: updatedContent,
        children: compositeBlock.children
      };

      console.log('Updated content:', updatedCompositeContent);

      return updatedCompositeContent;
    });
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
      console.error('Content is not initialized');
      return newChildId;
    }

    // Initialize the new child content properly
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

    let childId: ContentId | undefined;

    childId = (this.childBlocks as KeyedChildren)[key];
    delete (this.childBlocks as KeyedChildren)[key];

    if (childId) {
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
    return this.childBlocks[childKey as string]
  }
}