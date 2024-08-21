import { TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { BaseBlock } from './BaseBlock';
import { contentStore } from '../content/ContentStore';
import { CompositeContent } from '../content/content';
import { Model, CompositeModel, isCompositeModel } from '../model/model';

export abstract class CompositeBlockBase extends BaseBlock {
    @property({ type: Object }) childBlocks: Record<string | number, string> = {};
    
    @state() protected compositeModel?: CompositeModel;

    private defaultChildrenType: 'keyed' | 'indexed';

    constructor(defaultChildrenType: 'keyed' | 'indexed') {
        super();
        this.defaultChildrenType = defaultChildrenType;
        console.log('CompositeBlockBase constructor');
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

        this.childBlocks = {};
        const childrenType = model.childrenType || this.defaultChildrenType;
        if (childrenType === 'keyed') {
            this.initializeKeyedChildren(compositeBlock, this.compositeModel);
        } else {
            this.initializeIndexedChildren(compositeBlock);
        }

        contentStore.setBlock(compositeBlock);
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
            this.childBlocks[prop.key!] = childContentId;
        });
    }

    private initializeIndexedChildren(compositeBlock: CompositeContent) {
        compositeBlock.children.forEach((childId, index) => {
            this.childBlocks[index] = childId;
        });
    }

    private getChildProperties(model: CompositeModel): Model[] {
        if ('properties' in model) {
            return model.properties;
        } else if ('itemType' in model) {
            // For array types, we might not have child properties initially
            return [];
        } else if ('itemTypes' in model) {
            // For group types, itemTypes defines the allowed types, not necessarily existing children
            return Array.isArray(model.itemTypes) ? model.itemTypes : [];
        }
        return [];
    }

    protected addChildBlock(itemType: Model, key?: string | number) {
        const newChildBlock = contentStore.createBlockFromModel(itemType);
        const compositeBlock = this.content as CompositeContent;

        if (this.compositeModel?.childrenType === 'keyed' || this.defaultChildrenType === 'keyed') {
            if (key === undefined) {
                throw new Error('Key is required for keyed children');
            }
            this.childBlocks[key] = newChildBlock.id;
        } else {
            key = Object.keys(this.childBlocks).length;
            this.childBlocks[key] = newChildBlock.id;
        }
        compositeBlock.children.push(newChildBlock.id);

        contentStore.setBlock(compositeBlock);
        this.requestUpdate();
    }

    protected removeChildBlock(keyOrIndex: string | number) {
        const compositeBlock = this.content as CompositeContent;
        const childId = this.childBlocks[keyOrIndex];

        if (childId) {
            delete this.childBlocks[keyOrIndex];
            compositeBlock.children = compositeBlock.children.filter(id => id !== childId);
            contentStore.deleteBlock(childId);
            contentStore.setBlock(compositeBlock);
            this.requestUpdate();
        }
    }

    protected handleValueChanged(e: CustomEvent) {
        const { key, value } = e.detail;
        
        if (this.compositeModel?.childrenType === 'keyed' || this.defaultChildrenType === 'keyed') {
            const updatedContent = { ...this.content!.content, [key]: value };
            this.updateBlockContent(updatedContent);
        } else {
            const index = Object.values(this.childBlocks).indexOf(key);
            if (index !== -1) {
                const updatedContent = [...this.content!.content];
                updatedContent[index] = value;
                this.updateBlockContent(updatedContent);
            }
        }
    }

    protected updateChildModel(keyOrIndex: string | number, value: any) {
        const isKeyed = this.compositeModel?.childrenType === 'keyed' || this.defaultChildrenType === 'keyed';
        const updatedContent = isKeyed
            ? { ...this.content!.content, [keyOrIndex]: value }
            : [...this.content!.content].map((item, index) => index.toString() === keyOrIndex.toString() ? value : item);
        
        this.updateBlockContent(updatedContent);
    }

    abstract renderContent(): TemplateResult;
}