import { html, css, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { CompositeBlockBase } from './CompositeBlock';
import { ComponentFactory } from '../util/ComponentFactory';
import { GroupProperty, Property, isPropertyReference } from '../util/model';

@customElement('group-component')
export class GroupBlock extends CompositeBlockBase {
    constructor() {
        super('indexed');
    }

    @state() private showSlashMenu: boolean = false;

    static styles = [
        CompositeBlockBase.styles,
        css`
            .group-content {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-small);
            }
            .group-item {
                display: flex;
                align-items: center;
            }
            .remove-button {
                margin-left: var(--spacing-small);
            }
            .slash-menu {
                margin-top: var(--spacing-small);
            }
        `,
    ];

    public renderContent(): TemplateResult {
        if (!this.block || !this.library || !this.compositeModel) {
            return html`<div>Loading...</div>`;
        }

        const groupModel = this.compositeModel as GroupProperty;

        return html`
            <div>
                <h3>${groupModel.name || 'Group'}</h3>
                <div class="group-content">
                            childrenType: ${groupModel.childrenType}
                    ${repeat(
                        Object.entries(this.childBlocks),
                        ([key, _]) => key,
                        ([key, childId]) => html`
                            <div class="group-item">
                                ${ComponentFactory.createComponent(childId, this.library!, `${this.path}.${key}`)}
                                ${groupModel.editable
                                    ? html`<button class="remove-button" @click=${() => this.removeChildBlock(key)}>
                                            Remove
                                        </button>`
                                    : ''}
                            </div>
                        `
                    )}
                </div>
                ${groupModel.editable ? this.renderAddButton() : ''}
                ${this.showSlashMenu ? this.renderSlashMenu() : ''}
            </div>
        `;
    }

    private renderAddButton(): TemplateResult {
        return html`<button @click=${this.toggleSlashMenu}>Add Item</button>`;
    }

    private renderSlashMenu(): TemplateResult {
        const groupModel = this.compositeModel as GroupProperty;
        const itemTypes = this.getItemTypes(groupModel);

        return html`
            <div class="slash-menu">
                ${repeat(
                    itemTypes,
                    (itemType) => itemType.key,
                    (itemType) => html`
                        <button @click=${() => this.addItem(itemType)}>
                            ${itemType.name || itemType.key}
                        </button>
                    `
                )}
            </div>
        `;
    }

    private getItemTypes(groupModel: GroupProperty): Property[] {
        if (Array.isArray(groupModel.itemTypes)) {
            return groupModel.itemTypes;
        } else if (isPropertyReference(groupModel.itemTypes)) {
            const resolved = this.library!.getDefinition(
                groupModel.itemTypes.ref,
                groupModel.itemTypes.type
            );
            if (resolved && 'itemTypes' in resolved) {
                return this.getItemTypes(resolved as GroupProperty);
            }
        }
        console.warn(`Invalid itemTypes: ${JSON.stringify(groupModel.itemTypes)}`);
        return [];
    }

    private toggleSlashMenu() {
        this.showSlashMenu = !this.showSlashMenu;
    }

    private addItem(itemType: Property) {
        const key = itemType.key || `item_${Date.now()}`;
        this.addChildBlock(itemType, key);
        this.showSlashMenu = false;
    }
}