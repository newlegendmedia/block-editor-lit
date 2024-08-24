import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ComponentFactory } from '../util/ComponentFactory';
import { contentStore } from '../content/ContentStore';
import { Content, isCompositeContent } from '../content/content';
import { libraryStore } from '../model/libraryStore';
import { isElement, isObject, Model, isKeyedComposite, isIndexedComposite } from '../model/model';

@customElement('path-renderer')
export class PathRenderer extends LitElement {
    @state() private targetContentId: string | null = null;
    private _path: string = '';

    @property({ type: String })
    get path(): string {
        return this._path;
    }

    set path(value: string) {
        const oldValue = this._path;
        this._path = value;
        this.requestUpdate('path', oldValue);
        this.findTargetBlock();
    }

    static styles = css``;

    private findTargetBlock() {
        console.log(`Processing path: ${this._path}`);
        const pathParts = this._path.split(/[.\[\]]+/).filter(Boolean);
        const document = contentStore.getDocument(pathParts[0]);
        console.log(`Document found:`, document);

        if (!document) {
            console.error(`Document not found: ${pathParts[0]}`);
            this.targetContentId = null;
            return;
        }

        let currentBlock = contentStore.getBlock(document.rootBlock);
        console.log(`Root block:`, currentBlock);

        if (!currentBlock) {
            console.error(`Root block not found for document: ${pathParts[0]}`);
            this.targetContentId = null;
            return;
        }

        if (pathParts.length === 1) {
            this.targetContentId = currentBlock.id;
            return;
        }

        for (let i = 1; i < pathParts.length; i++) {
            if (!isCompositeContent(currentBlock)) {
                console.error(`Non-composite block encountered: ${currentBlock.id}`);
                this.targetContentId = null;
                return;
            }

            const childKey = pathParts[i];
            let childContentId: string | undefined;

            const model = this.getModelForBlock(currentBlock);
            if (!model) {
                console.error(`Model not found for block: ${currentBlock.id}`);
                this.targetContentId = null;
                return;
            }

            if (isIndexedComposite(model)) {
                const index = parseInt(childKey, 10);
                console.log(`Processing indexed child: ${index}`, currentBlock.children);
                if (!isNaN(index) && index >= 0 && index < currentBlock.children.length) {
                    childContentId = currentBlock.children[index];
                }
            } else if (isKeyedComposite(model)) {
                // Handle both regular and inline elements
                childContentId = currentBlock.children.find((childId) => {
                    const child = contentStore.getBlock(childId);
                    console.log(`Processing keyed child:`, child);
                    return child && (child.modelInfo.key === childKey || child.id === childKey);
                });

                // If not found, it might be an inline element
                if (!childContentId && isObject(model)) {
                    const childProperty = model.properties.find(prop => prop.key === childKey);
                    if (childProperty && isElement(childProperty)) {
                        childContentId = `inline:${currentBlock.id}:${childKey}`;
                    }
                }
            } else {
                console.error(`Invalid composite type for block: ${currentBlock.id}`);
                this.targetContentId = null;
                return;
            }

            if (!childContentId) {
                console.error(`Child block not found for key: ${childKey}`);
                this.targetContentId = null;
                return;
            }

            if (childContentId.startsWith('inline:')) {
                // We've reached an inline element, so we're done
                this.targetContentId = childContentId;
                return;
            }

            currentBlock = contentStore.getBlock(childContentId);
            if (!currentBlock) {
                console.error(`Block not found for id: ${childContentId}`);
                this.targetContentId = null;
                return;
            }

            console.log(`Found child block:`, currentBlock);
        }

        this.targetContentId = currentBlock.id;
        console.log(`Final target block ID: ${this.targetContentId}`);
    }

    private getModelForBlock(block: Content): Model | undefined {
        return block.modelDefinition || libraryStore.value.getDefinition(block.modelInfo.ref!, block.modelInfo.type);
    }

    render() {
        if (!this.targetContentId) {
            return html` <div>Block not found at path: ${this._path}</div> `;
        }

        return html`
            <div>
                ${ComponentFactory.createComponent(this.targetContentId, libraryStore.value, this._path)}
            </div>
        `;
    }
}