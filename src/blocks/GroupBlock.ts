import { html, css, TemplateResult } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { until } from 'lit/directives/until.js';
import { IndexedCompositeBlock } from './IndexedCompositeBlock';
import { ComponentFactory } from '../util/ComponentFactory';
import { GroupModel, Model } from '../model/model';
import { ContentId } from '../content/content';
import { contentStore } from '../resourcestore';
import { ModelStore } from '../model/libraryStore';

@customElement('group-block')
export class GroupBlock extends IndexedCompositeBlock {
  @state() private showSlashMenu: boolean = false;
  @property({ type: Array }) mirroredBlocks: string[] = [];
  @state() private childComponentPromises: Promise<TemplateResult>[] = [];
  @state() private childTypes: Map<ContentId, string> = new Map();
  @state() protected modelStore?: ModelStore;
  @state() private itemTypes: Model[] | null = null;

  private enableMirroring: boolean = false; // Feature toggle for mirroring

  static styles = [
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

  protected async initializeBlock() {
    await super.initializeBlock();
    await this.updateChildTypes();
    await this.initializeChildComponents();
    await this.loadItemTypes();
  }

  private async updateChildTypes() {
    const childTypePromises = (this.childBlocks as ContentId[]).map(async (childId) => {
      const childContent = await contentStore.get(childId);
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

  private createChildComponent(childId: ContentId, _index: number): Promise<TemplateResult> {
    return ComponentFactory.createComponent(childId, this.path);
  }

  protected renderContent(): TemplateResult {
    if (!this.content || !this.modelStore || !this.model) {
      return html`<div>Group Loading...</div>`;
    }
    return html`
      <div>
        ${this.renderAddButton()}
        ${this.showSlashMenu ? this.renderSlashMenu() : ''}
        ${until(
          Promise.all(this.childComponentPromises).then(components => html`${components}`),
          html`<span>Loading child components...</span>`
        )}
      </div>
    `;
  }

  private renderAddButton(): TemplateResult {
    return html`<button @click=${this.toggleSlashMenu}>Add Item</button>`;
  }

  private renderSlashMenu(): TemplateResult {
    return html`
      <div class="slash-menu">
        ${this.itemTypes
          ? this.itemTypes.map(itemType => 
              html`<button @click=${() => this.addItem(itemType)}>
                ${itemType.name || itemType.key}
              </button>`
            )
          : html`<span>Loading item types...</span>`
        }
      </div>
    `;
  }

  private async loadItemTypes(): Promise<void> {
    if (this.itemTypes) {
      return;
    }

    const groupModel = this.model as GroupModel;
    this.itemTypes = await this.getItemTypes(groupModel);
    this.requestUpdate();
  }

  private async getItemTypes(groupModel: GroupModel): Promise<Model[]> {
    if (Array.isArray(groupModel.itemTypes)) {
      console.log('getItemTypes Array.isArray', groupModel.itemTypes);
      return groupModel.itemTypes;
    }
    console.log('getItemTypes not found - returning empty array');
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