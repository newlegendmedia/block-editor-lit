import { CompositeBlock, KeyedChildren } from "./CompositeBlock";
import {
  Content,
  CompositeContent,
  KeyedCompositeContent,
} from "../content/content";
import {
  CompositeModel,
  isCompositeModel,
  isElement,
  Model,
} from "../model/model";
import { contentStore } from "../resourcestore";
import { ContentFactory } from "../store/ContentFactory";

export abstract class KeyedCompositeBlock extends CompositeBlock<"keyed"> {
  protected inlineChildren: boolean = false;

  protected abstract getModelProperties(): Model[];
  protected abstract getDefaultValue(prop: Model): any;

  protected syncChildrenWithContent(): void {
    if (!this.content) return;

    const compositeContent = this.content as CompositeContent;
    const keyedContent: KeyedCompositeContent = {};

    for (const [key, value] of Object.entries(this.childBlocks)) {
      keyedContent[key] = value;
    }

    compositeContent.content = keyedContent;
    compositeContent.children = this.inlineChildren
      ? []
      : Object.values(this.childBlocks as KeyedChildren);
  }

  protected initializeIndexedChildren(): Promise<void> {
    throw new Error("Keyed composites do not support indexed children");
  }

  protected async initializeChildBlocks(): Promise<void> {
    if (!this.content || !this.model) return;

    this.inlineChildren =
      (this.model as CompositeModel).inlineChildren || false;

    if (this.inlineChildren) {
      await this.initializeInlineChildren();
    } else {
      await this.initializeKeyedChildren();
    }

    await this.updateChildStructure();
  }

  private async initializeInlineChildren(): Promise<void> {
    if (!this.model || !isCompositeModel(this.model)) return;

    const initialContent: KeyedCompositeContent = {};

    for (const prop of this.getModelProperties()) {
      if (prop.key) {
        if (isElement(prop)) {
          const existingValue = (
            this.content?.content as KeyedCompositeContent
          )?.[prop.key];
          initialContent[prop.key] =
            existingValue !== undefined
              ? existingValue
              : this.getDefaultValue(prop);
        } else {
          const childContent = await this.initializeNonElementChild(prop);
          initialContent[prop.key] = childContent.id;
        }
      }
    }

    await this.updateContent((content) => ({
      ...content,
      content: initialContent,
      children: [],
    }));

    this.childBlocks = initialContent;
  }

  protected async initializeKeyedChildren(): Promise<void> {
    const compositeContent = this.content as CompositeContent;
    const childProperties = this.getModelProperties();
    this.childBlocks = {} as KeyedChildren;

    if (!Array.isArray(compositeContent.children)) {
      compositeContent.children = [];
    }

    let updatedContent: KeyedCompositeContent =
      typeof compositeContent.content === "string"
        ? JSON.parse(compositeContent.content)
        : (compositeContent.content as KeyedCompositeContent);

    for (const prop of childProperties) {
      if (prop.key) {
        let childContentId = updatedContent[prop.key];

        if (!childContentId) {
          const { modelInfo, modelDefinition, content } =
            ContentFactory.createContentFromModel(prop);
          if (!modelDefinition) throw new Error("Model definition not found");
          const childContent = await contentStore.create(
            modelInfo,
            modelDefinition,
            content,
            this.contentId,
          );
          childContentId = childContent.id;
          compositeContent.children.push(childContentId);
        }

        (this.childBlocks as KeyedChildren)[prop.key] = childContentId;
        updatedContent[prop.key] = childContentId;
      }
    }

    await this.updateContent(
      (currentContent: Content): CompositeContent => ({
        ...currentContent,
        content: updatedContent,
        children: compositeContent.children,
      }),
    );
  }

  private async initializeNonElementChild(prop: Model): Promise<Content> {
    const existingChildId = (this.content?.content as KeyedCompositeContent)?.[
      prop.key!
    ];

    if (existingChildId) {
      const existingContent = await contentStore.get(existingChildId);

      if (existingContent) {
        return existingContent;
      }
    }
    const { modelInfo, modelDefinition, content } =
      ContentFactory.createContentFromModel(prop);
    if (!modelDefinition) throw new Error("Model definition not found");
    return await contentStore.create(
      modelInfo,
      modelDefinition,
      content as KeyedCompositeContent,
      this.contentId,
    );
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
      await this.updateContent((currentContent) => {
        const updatedContent = currentContent as CompositeContent;
        delete (updatedContent.content as KeyedCompositeContent)[key];
        updatedContent.children = updatedContent.children.filter(
          (id) => id !== childId,
        );
        return updatedContent;
      });
      await this.updateChildStructure();
      await contentStore.delete(childId);
    }
  }

  protected getChildPath(childKey: string): string {
    return `${this.path}.${childKey}`;
  }

  protected getChildBlockId(childKey: string): string | undefined {
    if (this.inlineChildren) {
      const childContent = (this.content?.content as KeyedCompositeContent)?.[
        childKey
      ];
      return typeof childContent === "string" ? childContent : undefined;
    }
    return this.childBlocks[childKey as string];
  }
}
