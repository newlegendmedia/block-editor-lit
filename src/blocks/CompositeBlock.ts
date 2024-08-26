import { property, state } from 'lit/decorators.js';
import { BaseBlock } from './BaseBlock';
import { Content, ContentId, CompositeContent, IndexedCompositeContent, KeyedCompositeContent } from '../content/content';
import { contentStore } from '../store/ContentStore';
import { Model, CompositeModel, isObject, isArray, isGroup, isElement, isKeyedComposite, isIndexedComposite } from '../model/model';

export type KeyedChildren = Record<string, ContentId>;
export type IndexedChildren = ContentId[];
export type MixedKeyedChildren = Record<string, ContentId | any>;
export type CompositeType = 'keyed' | 'indexed';

export abstract class CompositeBlock<T extends CompositeType> extends BaseBlock {
//  @property({ type: Object })
  childBlocks!: T extends 'keyed' ? KeyedChildren | MixedKeyedChildren : IndexedChildren;

  @state() protected compositeType: CompositeType = 'keyed';
  @property({ type: Boolean }) inlineChildren: boolean = false;

  async connectedCallback(): Promise<void> {
    await super.connectedCallback();
    await this.initializeChildBlocks();
  }

  protected async initializeChildBlocks(): Promise<void> {
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
        await this.initializeInlineKeyedChildren(this.content as CompositeContent, this.model);
      } else {
        await this.initializeKeyedChildren(this.content as CompositeContent, this.model);
      }
    }
	  
    this.content.content = this.childBlocks;
    await contentStore.updateContent(this.content.id, () => this.content as Content);
  }

  private async initializeInlineKeyedChildren(compositeBlock: CompositeContent, model: CompositeModel) {
    const childProperties = this.getChildProperties(model);
    this.childBlocks = {} as T extends 'keyed' ? KeyedChildren | MixedKeyedChildren : IndexedChildren;
    
    for (const prop of childProperties) {
      if (isElement(prop)) {
        (this.childBlocks as MixedKeyedChildren)[prop.key!] = null;
      } else {
        let childContentId = compositeBlock.children.find(async (childId) => {
          const childBlock = await contentStore.getContent(childId);
          return childBlock && childBlock.modelInfo.key === prop.key;
        });
        
        if (!childContentId) {
          const childBlock = await contentStore.createContent(prop);
          childContentId = childBlock.id;
          compositeBlock.children.push(childContentId);
        }
        
        (this.childBlocks as MixedKeyedChildren)[prop.key!] = childContentId;
      }
    }
  }

  private async initializeKeyedChildren(compositeBlock: CompositeContent, model: CompositeModel) {
    const childProperties = this.getChildProperties(model);
	  this.childBlocks = {} as T extends 'keyed' ? KeyedChildren | MixedKeyedChildren : IndexedChildren;
	  
	  if (!Array.isArray(compositeBlock.children)) {
		compositeBlock.children = [];
	  }
    
    for (let i = 0; i < childProperties.length; i++) {
      const prop = childProperties[i];
      let childContentId = compositeBlock.children[i];
      
      if (!childContentId) {
        const childBlock = await contentStore.createContent(prop);
        childContentId = childBlock.id;
        compositeBlock.children[i] = childContentId;
      }
      
      (this.childBlocks as KeyedChildren)[prop.key!] = childContentId;
	}
  }

	private initializeIndexedChildren(compositeBlock: CompositeContent) {
		if (Array.isArray(compositeBlock.children)) {
			this.childBlocks = compositeBlock.children as IndexedChildren;
		} else {
			this.childBlocks = [] as IndexedChildren;
		}
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

	protected async addChildBlock(itemType: Model, keyOrIndex?: T extends 'keyed' ? string : number): Promise<ContentId> {
	  
	const newChildContent = await contentStore.createContent(itemType);
	
	const compositeContent = this.content as CompositeContent;
	if (this.compositeType === 'keyed') {
	  const key = keyOrIndex as string || newChildContent.id;
		(this.childBlocks as KeyedChildren)[key] = newChildContent.id;
//		compositeContent.children = (this.childBlocks as KeyedChildren)
	} else {
	  (this.childBlocks as IndexedChildren).push(newChildContent.id);
	  compositeContent.children = (this.childBlocks as IndexedChildren)
	}
		
	await this.updateContent(content => ({
	  ...content,
	  content: this.childBlocks,
	  children: [...(content as CompositeContent).children, newChildContent.id]
	}));
  
	this.requestUpdate();
  
	return newChildContent.id;
  }

  protected async removeChildBlock(keyOrIndex: T extends 'keyed' ? string : number): Promise<void> {
    let childId: ContentId | undefined;

    if (this.compositeType === 'keyed') {
      childId = (this.childBlocks as KeyedChildren)[keyOrIndex as string];
      delete (this.childBlocks as KeyedChildren)[keyOrIndex as string];
    } else {
      childId = (this.childBlocks as IndexedChildren)[keyOrIndex as number];
      (this.childBlocks as IndexedChildren).splice(keyOrIndex as number, 1);
    }

    if (childId) {
      await this.updateContent(content => ({
        ...content,
        content: this.childBlocks,
        children: (content as CompositeContent).children.filter(id => id !== childId)
      }));

      await contentStore.deleteContent(childId);
    }

    this.requestUpdate();
  }
}