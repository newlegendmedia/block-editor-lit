import { LitElement, html, css, TemplateResult } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { until } from 'lit/directives/until.js';
import { IndexedCompositeBlock } from './IndexedCompositeBlock';
import { ComponentFactory } from '../util/ComponentFactory';
import { GroupModel, Model, isModelReference } from '../model/model';
import { ContentId, Content } from '../content/content';
import { contentStore } from '../store';

@customElement('group-block')
export class GroupBlock extends IndexedCompositeBlock {
  @state() private showSlashMenu: boolean = false;
  @property({ type: Array }) mirroredBlocks: string[] = [];
  @state() private childComponentPromises: Promise<TemplateResult>[] = [];
  @state() private childTypes: Map<ContentId, string> = new Map();

  private enableMirroring: boolean = false; // Feature toggle for mirroring

  static styles = [
    IndexedCompositeBlock.styles,
    css`
      .group-content {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-medium);
      }
      .group-item {
        display: flex;
        align-items: flex-start;
        gap: var(--spacing-medium);
      }
      .item-container {
        flex: 1;
      }
      .mirror-container {
        flex: 1;
        border-left: 2px dashed var(--border-color);
        padding-left: var(--spacing-medium);
      }
      .remove-button {
        margin-left: var(--spacing-small);
      }
      .slash-menu {
        margin-top: var(--spacing-small);
      }
    `,
  ];

  async connectedCallback() {
    await super.connectedCallback();
    await this.initializeChildBlocks();
    await this.updateChildTypes();
    await this.initializeChildComponents();
  }

  private async updateChildTypes() {
    const childTypePromises = (this.childBlocks as ContentId[]).map(async (childId) => {
      const childContent = await contentStore.getContent(childId);
      return [childId, childContent?.modelInfo.key || 'unknown'] as [ContentId, string];
    });
    const childTypes = await Promise.all(childTypePromises);
    this.childTypes = new Map(childTypes);
    this.requestUpdate();
  }

  private async initializeChildComponents() {
    if (!Array.isArray(this.childBlocks)) {
      console.error('ChildBlocks is not an array:', this.childBlocks);
      return;
    }

    this.childComponentPromises = this.childBlocks.map((childId, index) => 
      this.createChildComponent(childId, index)
    );

    this.requestUpdate();
  }

  private createChildComponent(childId: ContentId, index: number): Promise<TemplateResult> {
    return ComponentFactory.createComponent(
      childId,
      this.library!,
      this.getChildPath(index, this.childTypes.get(childId))
    );
  }

  protected renderContent(): TemplateResult {
    if (!this.content || !this.library || !this.model) {
      return html`<div>Group Loading...</div>`;
    }

    const groupModel = this.model as GroupModel;

    return html`
      <div>
        <h3>${groupModel.name || 'Group'}</h3>
        <div class="group-content">
          ${repeat(
            this.childComponentPromises,
            (_, index) => index,
            (childPromise, index) => html`
              <div class="group-item">
                <div class="item-container">
                  ${until(
                    childPromise,
                    html`<span>Loading child component...</span>`,
                    html`<span>Error loading component</span>`
                  )}
                </div>
                ${this.enableMirroring && this.mirroredBlocks[index] ? html`
                  <div class="mirror-container">
                    ${until(
                      ComponentFactory.createComponent(
                        `mirror:${this.childBlocks[index]}`,
                        this.library!,
                        `${this.getChildPath(index, this.childTypes.get(this.childBlocks[index]))}.mirror`
                      ),
                      html`<span>Loading mirrored component...</span>`,
                      html`<span>Error loading mirrored component</span>`
                    )}
                  </div>
                ` : ''}
                ${groupModel.editable
                  ? html`<button class="remove-button" @click=${() => this.removeChildBlock(index)}>
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
    const groupModel = this.model as GroupModel;
    const itemTypes = this.getItemTypes(groupModel);

    return html`
      <div class="slash-menu">
        ${repeat(
          itemTypes,
          (itemType) => itemType.key,
          (itemType) => html`
            <button @click=${() => this.addItem(itemType)}>${itemType.name || itemType.key}</button>
          `
        )}
      </div>
    `;
  }

  private getItemTypes(groupModel: GroupModel): Model[] {
    if (Array.isArray(groupModel.itemTypes)) {
      return groupModel.itemTypes;
    } else if (isModelReference(groupModel.itemTypes)) {
      const resolved = this.library!.getDefinition(
        groupModel.itemTypes.ref,
        groupModel.itemTypes.type
      );
      if (resolved && 'itemTypes' in resolved) {
        return this.getItemTypes(resolved as GroupModel);
      }
    }
    console.warn(`Invalid itemTypes: ${JSON.stringify(groupModel.itemTypes)}`);
    return [];
  }

  private toggleSlashMenu() {
    this.showSlashMenu = !this.showSlashMenu;
  }

  private async addItem(itemType: Model) {
    const newChildId = await this.addChildBlock(itemType);
    await this.updateChildTypes();

    if (this.enableMirroring) {
      this.mirroredBlocks = [...this.mirroredBlocks, newChildId];
    }

    // Add the new child component promise
    this.childComponentPromises = [
      ...this.childComponentPromises,
      this.createChildComponent(newChildId, this.childComponentPromises.length)
    ];

    this.showSlashMenu = false;
    this.requestUpdate();
  }

  protected async removeChildBlock(index: number) {
    await super.removeChildBlock(index);
    await this.updateChildTypes();

    if (this.enableMirroring) {
      this.mirroredBlocks = this.mirroredBlocks.filter((_, i) => i !== index);
    }

    // Remove the child component promise
    this.childComponentPromises = this.childComponentPromises.filter((_, i) => i !== index);

    this.requestUpdate();
  }
}