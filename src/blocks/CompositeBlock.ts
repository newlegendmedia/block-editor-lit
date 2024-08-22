import { TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { BaseBlock } from './BaseBlock';
import { contentStore } from '../content/ContentStore';
import { CompositeContent } from '../content/content';
import { Model, CompositeModel, isCompositeModel } from '../model/model';
import type { CompositeType } from '../model/model';

type KeyedChildren = Record<string, string>;
type IndexedChildren = string[];

export abstract class CompositeBlock<T extends CompositeType> extends BaseBlock {
    @property({ type: Object }) childBlocks: T extends 'keyed' ? KeyedChildren : IndexedChildren = {} as any;
    
    @state() protected compositeModel?: CompositeModel;

    constructor(private childrenType: T) {
        super();
    }

    connectedCallback(): void {
        super.connectedCallback();
        this.initializeChildBlocks();
    }

    private initializeChildBlocks() {
        if (!this.content) return;

        const model = this.getModel();
        if (!model || !isCompositeModel(model)) return;

        this.compositeModel = model;

        const compositeBlock = this.content as CompositeContent;
        if (!compositeBlock.children) {
            compositeBlock.children = [];
        }

        this.childBlocks = {} as any;
        if (this.childrenType === 'keyed') {
            this.initializeKeyedChildren(compositeBlock, this.compositeModel);
        } else {
            this.initializeIndexedChildren(compositeBlock);
        }

        contentStore.setBlock(compositeBlock);
    }

    private initializeKeyedChildren(compositeBlock: CompositeContent, model: CompositeModel) {
        if (this.childrenType !== 'keyed') return;
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
        this.childBlocks = compositeBlock.children as T extends 'keyed' ? KeyedChildren : IndexedChildren;
    }

    private getChildProperties(model: CompositeModel): Model[] {
        if ('properties' in model) {
            return model.properties;
        } else if ('itemType' in model) {
            return Array.isArray(model.itemType) ? model.itemType : [model.itemType];
        } else if ('itemTypes' in model) {
            return Array.isArray(model.itemTypes) ? model.itemTypes : [model.itemTypes];
        }
        return [];
    }

    protected getChildPath(childKey: string | number): string {
        if (this.childrenType === 'keyed') {
            return `${this.path}.${childKey}`;
        } else {
            return `${this.path}[${childKey}]`;
        }
    }

    // New method to get child content ID
    protected getChildContentId(childKey: string | number): string | undefined {
        if (this.childrenType === 'keyed') {
            return (this.childBlocks as KeyedChildren)[childKey as string];
        } else {
            return (this.childBlocks as IndexedChildren)[childKey as number];
        }
    }

    protected addChildBlock(itemType: Model, key?: T extends 'keyed' ? string : number) {
        const newChildBlock = contentStore.createBlockFromModel(itemType);
        const compositeBlock = this.content as CompositeContent;

        if (this.childrenType === 'keyed') {
            if (key === undefined) {
                throw new Error('Key is required for keyed children');
            }
            (this.childBlocks as KeyedChildren)[key as string] = newChildBlock.id;
        } else {
            (this.childBlocks as IndexedChildren).push(newChildBlock.id);
        }

        contentStore.setBlock(compositeBlock);
        this.requestUpdate();
    }

    protected removeChildBlock(keyOrIndex: T extends 'keyed' ? string : number) {
        const compositeBlock = this.content as CompositeContent;
        const childId = this.childrenType === 'keyed' 
            ? (this.childBlocks as KeyedChildren)[keyOrIndex as string]
            : (this.childBlocks as IndexedChildren)[keyOrIndex as number];

        if (childId) {
            if (this.childrenType === 'keyed') {
                delete (this.childBlocks as KeyedChildren)[keyOrIndex as string];
            } else {
                (this.childBlocks as IndexedChildren).splice(keyOrIndex as number, 1);
            }
            compositeBlock.children = compositeBlock.children.filter(id => id !== childId);
            contentStore.deleteBlock(childId);
            contentStore.setBlock(compositeBlock);
            this.requestUpdate();
        }
    }

    protected handleValueChanged(e: CustomEvent) {
        const { key, value } = e.detail;
        
        if (this.childrenType === 'keyed') {
            const updatedContent = { ...this.content!.content, [key]: value };
            this.updateBlockContent(updatedContent);
        } else {
            const index = (this.childBlocks as IndexedChildren).indexOf(key);
            if (index !== -1) {
                const updatedContent = [...this.content!.content];
                updatedContent[index] = value;
                this.updateBlockContent(updatedContent);
            }
        }
    }

    abstract renderContent(): TemplateResult;
}