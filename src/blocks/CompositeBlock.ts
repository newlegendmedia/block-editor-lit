import { TemplateResult, PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { BaseBlock } from './BaseBlock';
import { blockStore, CompositeBlock as CompositeBlockType } from '../blocks/BlockStore';
import { Property, CompositeProperty, isCompositeProperty } from '../util/model';

export abstract class CompositeBlockBase extends BaseBlock {
    @property({ type: Object }) childBlocks: Record<string | number, string> = {};
    
    @state() protected compositeModel?: CompositeProperty;

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
        if (!this.block) return;

        const model = this.getModel();
        if (!model || !isCompositeProperty(model)) return;

        this.compositeModel = model;

        const compositeBlock = this.block as CompositeBlockType;
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

        blockStore.setBlock(compositeBlock);
    }

    private initializeKeyedChildren(compositeBlock: CompositeBlockType, model: CompositeProperty) {
        const childProperties = this.getChildProperties(model);
        childProperties.forEach((prop, index) => {
            let childBlockId = compositeBlock.children[index];
            if (!childBlockId) {
                const childBlock = blockStore.createBlockFromModel(prop);
                childBlockId = childBlock.id;
                compositeBlock.children[index] = childBlockId;
            }
            this.childBlocks[prop.key!] = childBlockId;
        });
    }

    private initializeIndexedChildren(compositeBlock: CompositeBlockType) {
        compositeBlock.children.forEach((childId, index) => {
            this.childBlocks[index] = childId;
        });
    }

    private getChildProperties(model: CompositeProperty): Property[] {
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

    protected addChildBlock(itemType: Property, key?: string | number) {
        const newChildBlock = blockStore.createBlockFromModel(itemType);
        const compositeBlock = this.block as CompositeBlockType;

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

        blockStore.setBlock(compositeBlock);
        this.requestUpdate();
    }

    protected removeChildBlock(keyOrIndex: string | number) {
        const compositeBlock = this.block as CompositeBlockType;
        const childId = this.childBlocks[keyOrIndex];

        if (childId) {
            delete this.childBlocks[keyOrIndex];
            compositeBlock.children = compositeBlock.children.filter(id => id !== childId);
            blockStore.deleteBlock(childId);
            blockStore.setBlock(compositeBlock);
            this.requestUpdate();
        }
    }

    protected handleValueChanged(e: CustomEvent) {
        const { key, value } = e.detail;
        
        if (this.compositeModel?.childrenType === 'keyed' || this.defaultChildrenType === 'keyed') {
            const updatedContent = { ...this.block!.content, [key]: value };
            this.updateBlockContent(updatedContent);
        } else {
            const index = Object.values(this.childBlocks).indexOf(key);
            if (index !== -1) {
                const updatedContent = [...this.block!.content];
                updatedContent[index] = value;
                this.updateBlockContent(updatedContent);
            }
        }
    }

    protected updateChildProperty(keyOrIndex: string | number, value: any) {
        const isKeyed = this.compositeModel?.childrenType === 'keyed' || this.defaultChildrenType === 'keyed';
        const updatedContent = isKeyed
            ? { ...this.block!.content, [keyOrIndex]: value }
            : [...this.block!.content].map((item, index) => index.toString() === keyOrIndex.toString() ? value : item);
        
        this.updateBlockContent(updatedContent);
    }

    abstract renderContent(): TemplateResult;
}