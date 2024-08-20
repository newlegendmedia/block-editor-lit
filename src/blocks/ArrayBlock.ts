import { html, css, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { CompositeBlockBase } from './CompositeBlock';
import { ComponentFactory } from '../util/ComponentFactory';
import { ArrayProperty } from '../util/model';

@customElement('array-component')
export class ArrayBlock extends CompositeBlockBase {
    constructor() {
        super('indexed');
    }

    static styles = [
        CompositeBlockBase.styles,
        css`
            .array-content {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-small);
            }
            .array-item {
                display: flex;
                align-items: center;
            }
            .remove-button {
                margin-left: var(--spacing-small);
            }
        `,
    ];

    public renderContent(): TemplateResult {
        if (!this.block || !this.library || !this.compositeModel) {
            return html`<div>Loading...</div>`;
        }

        const arrayModel = this.compositeModel as ArrayProperty;

        return html`
            <div>
                <h3>${arrayModel.name || 'Array'}</h3>
                <div class="array-content">
                    ${repeat(
                        Object.entries(this.childBlocks),
                        ([index, _]) => index,
                        ([index, childId]) => html`
                            <div class="array-item">
                                ${ComponentFactory.createComponent(childId, this.library!, `${this.path}[${index}]`)}
                                <button class="remove-button" @click=${() => this.removeChildBlock(index)}>
                                    Remove
                                </button>
                            </div>
                        `
                    )}
                </div>
                ${arrayModel.repeatable
                    ? html`<button @click=${() => this.addChildBlock(arrayModel.itemType)}>
                           Add ${arrayModel.itemType.name || 'Item'}
                       </button>`
                    : ''}
            </div>
        `;
    }
}