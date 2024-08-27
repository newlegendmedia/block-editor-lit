import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ComponentFactory } from '../util/ComponentFactory';
import { contentStore } from '../store/ContentStore';
import { Content, isCompositeContent } from '../content/content';
import { libraryStore } from '../model/libraryStore';
import { until } from 'lit/directives/until.js';

@customElement('path-renderer')
export class PathRenderer extends LitElement {
    @state() private targetContentId: string | null = null;
    @state() private error: string | null = null;
    
    private _path: string = '';

    @property({ type: String })
    set path(value: string) {
        const oldValue = this._path;
        this._path = value;
        if (oldValue !== value) {
            ;
            this.findTargetBlock();
        }
    }

    get path(): string {
        return this._path;
    }

    static styles = css`
        :host {
            display: block;
        }
        .error {
            color: red;
            font-weight: bold;
        }
    `;

    private async findTargetBlock() {
        ;
        this.error = null;
        this.targetContentId = null;
    
        const pathParts: string[] = this.path.match(/[^.\[\]]+|\[\d+\]/g) || [];
        
        if (pathParts.length === 0) {
            this.error = "Invalid path";
            return;
        }
    
        try {
            let currentContent: Content | undefined = await contentStore.getContent(pathParts[0]);
            ;
    
            if (!currentContent) {
                throw new Error(`Content not found for root: ${pathParts[0]}`);
            }
    
            for (let i = 1; i < pathParts.length; i++) {
                if (!isCompositeContent(currentContent)) {
                    throw new Error(`Non-composite content encountered: ${currentContent.id}`);
                }
    
                const part = pathParts[i];
                let childId: string | undefined;
    
                if (part.startsWith('[') && part.endsWith(']')) {
                    // Handle array index
                    const index = parseInt(part.slice(1, -1), 10);
                    if (isNaN(index) || index < 0 || index >= currentContent.children.length) {
                        throw new Error(`Invalid array index: ${part}`);
                    }
                    childId = currentContent.children[index];
                } else {
                    // Handle object key
                    if (typeof currentContent.content === 'object' && currentContent.content !== null) {
                        childId = (currentContent.content as Record<string, string>)[part];
                    }
    
                    if (!childId && Array.isArray(currentContent.children)) {
                        const childContent: (Content | null)[] = await Promise.all(
                            currentContent.children.map(async (id): Promise<Content | null> => {
                                const child = await contentStore.getContent(id);
                                return child && child.modelInfo.key === part ? child : null;
                            })
                        );
                        const foundChild = childContent.find((child): child is Content => child !== null);
                        childId = foundChild?.id;
                    }
                }
    
                if (!childId) {
                    throw new Error(`Child content not found for key: ${part}`);
                }
    
                currentContent = await contentStore.getContent(childId);
                if (!currentContent) {
                    throw new Error(`Content not found for id: ${childId}`);
                }
    
                ;
            }
    
            this.targetContentId = currentContent.id;
            ;
        } catch (error) {
            console.error('Error in findTargetBlock:', error);
            this.error = error instanceof Error ? error.message : String(error);
        }
    
        this.requestUpdate();
    }

    render() {
        ;

        return html`
            <div>
                <p>PathRenderer is active. Current path: ${this.path}</p>
                ${this.error
                    ? html`<div class="error">Error: ${this.error}</div>`
                    : this.targetContentId
                        ? html`<div>
                            ${until(
                                ComponentFactory.createComponent(this.targetContentId, libraryStore.value, this.path),
                                html`<p>Loading component...</p>`,
                                html`<p>Error loading component</p>`
                            )}
                          </div>`
                        : html`<div>Loading...</div>`
                }
            </div>
        `;
    }
}