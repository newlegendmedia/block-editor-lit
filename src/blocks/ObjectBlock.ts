import { html, css, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { CompositeBlockBase } from './CompositeBlock';
import { ComponentFactory } from '../util/ComponentFactory';
import { ObjectProperty } from '../util/model';

@customElement('object-component')
export class ObjectBlock extends CompositeBlockBase {
    constructor() {
        super('keyed');
    }
    
    static styles = [
        CompositeBlockBase.styles,
        css`
            .object-content {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-small);
            }
        `,
    ];

    renderContent(): TemplateResult {
        if (!this.block || !this.library || !this.compositeModel) {
            return html`<div>Loading...</div>`;
        }

        const objectModel = this.compositeModel as ObjectProperty;

        return html`
            <div>
                <h2>${objectModel.name || 'Object'}</h2>
                <div class="object-content">
                    ${repeat(
                        objectModel.properties,
                        (prop) => prop.key!,
                        (prop) => this.renderProperty(prop.key!)
                    )}
                </div>
            </div>
        `;
    }

    private renderProperty(key: string): TemplateResult {
        const childBlockId = this.childBlocks[key];
        if (!childBlockId) {
            return html`<div>Error: Child block not found for ${key}</div>`;
        }
        const childPath = `${this.path}.${key}`;
        return ComponentFactory.createComponent(childBlockId, this.library!, childPath);
    }
}