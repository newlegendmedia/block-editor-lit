import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ComponentFactory } from '../util/ComponentFactory';
import { contentStore } from '../content/ContentStore';
import { Content, CompositeContent } from '../content/content';
import { libraryStore } from '../model/libraryStore';

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
            if (!this.isCompositeBlock(currentBlock)) {
                console.error(`Non-composite block encountered: ${currentBlock.id}`);
                this.targetContentId = null;
                return;
            }

            const childKey = pathParts[i];
            let childContentId: string | undefined;

            if (!currentBlock.modelInfo.childrenType) {
                if (currentBlock.modelInfo.type === 'group') {
                    currentBlock.modelInfo.childrenType = 'indexed';
                } else if (currentBlock.modelInfo.type === 'object') {
                    currentBlock.modelInfo.childrenType = 'keyed';
                } else if (currentBlock.modelInfo.type === 'array') {
                    currentBlock.modelInfo.childrenType = 'indexed';
                } else {
                    console.error(`Invalid Block Type for Composites: ${currentBlock.modelInfo.type}`);
                    this.targetContentId = null;
                    return;
                }
            }

            if (currentBlock.modelInfo.childrenType === 'indexed') {
                const index = parseInt(childKey, 10);
                console.log(`Processing indexed child: ${index}`, currentBlock.children);
                if (!isNaN(index) && index >= 0 && index < currentBlock.children.length) {
                    childContentId = currentBlock.children[index];
                }
            } else {
                childContentId = currentBlock.children.find((childId) => {
                    const child = contentStore.getBlock(childId);
                    console.log(`Processing keyed child:`, child);
                    return child && (child.modelInfo.key === childKey || child.id === childKey);
                });
            }

            if (!childContentId) {
                console.error(`Child block not found for key: ${childKey}`);
                this.targetContentId = null;
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

    private isCompositeBlock(block: Content): block is CompositeContent {
        return 'children' in block && Array.isArray((block as CompositeContent).children);
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