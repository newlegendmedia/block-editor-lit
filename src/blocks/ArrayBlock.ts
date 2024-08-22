import { html, css, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { CompositeBlock } from './CompositeBlock';
import { ComponentFactory } from '../util/ComponentFactory';
import { ArrayModel } from '../model/model';
@customElement('array-block')
export class ArrayBlock extends CompositeBlock<'indexed'> {
    static styles = [
        CompositeBlock.styles,
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

    renderContent(): TemplateResult {
        if (!this.content || !this.library || !this.compositeModel) {
            return html`<div>Loading...</div>`;
        }

        const arrayModel = this.compositeModel as ArrayModel;

        return html`
            <div>
                <h3>${arrayModel.name || 'Array'}</h3>
                <div class="array-content">
                    ${repeat(
                        this.childBlocks as string[],
                        (childId) => childId,
                        (childId, index) => html`
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