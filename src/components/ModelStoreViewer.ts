import { LitElement, html, css, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { libraryStore, ModelStore } from '../model/libraryStore';
import { Model } from '../model/model';
import { HierarchicalItem } from '../tree/HierarchicalItem';

@customElement('model-store-viewer')
export class ModelStoreViewer extends LitElement {
  @state() private models: Model[] = [];
  @state() private modelStore: ModelStore | null = null;
  @state() private viewMode: 'flat' | 'hierarchical' = 'flat';
  @state() private modelsHierarchy: HierarchicalItem<Model> | null = null;

  private unsubscribe: (() => void) | null = null;

  static styles = css`
    :host {
      display: block;
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
    }
    .model-store-viewer {
      padding: 10px;
    }
    .model-item {
      border: 1px solid #ccc;
      border-radius: 4px;
      margin-bottom: 10px;
      padding: 8px;
    }
    .model-item-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .model-type {
      color: #666;
      font-size: 12px;
    }
    .model-details {
      margin-top: 5px;
    }
    .property-list {
      list-style-type: none;
      padding: 0;
      margin: 0;
    }
    .property-item {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #eee;
      padding: 2px 0;
    }
    .property-key {
      font-weight: bold;
      margin-right: 8px;
    }
    .property-value {
      word-break: break-all;
      max-width: 60%;
      text-align: right;
    }
    .toggle-button {
      margin-bottom: 10px;
    }
    .level-wrap {
      margin-left: 15px;
    }
  `;

    connectedCallback() {
        this.modelStore = libraryStore.value;
      super.connectedCallback();
      this.unsubscribe = this.modelStore.subscribeAll(this.handleModelChange.bind(this));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

//   private handleModelStoreChange(modelStore: ModelStore, ready: boolean) {
//     if (ready) {
//       this.modelStore = modelStore;
//       this.updateModels();
//     }
//   }
    
  private handleModelChange() {
    this.updateModels();
 }

  private async updateModels() {
    if (this.modelStore) {
        this.models = await this.modelStore.getAll();
        this.modelsHierarchy = null;
      this.modelsHierarchy = await this.modelStore.getAllHierarchical();
    }
    this.requestUpdate();
  }

  render() {
    return html`
      <div class="model-store-viewer">
        <h3>Model Store</h3>
        <button @click=${this.toggleViewMode} class="toggle-button">
          Switch to ${this.viewMode === 'flat' ? 'Hierarchical' : 'Flat'} View
        </button>
        <div>Model Count: ${this.models.length}</div>
        <div class="model-list">
          ${this.viewMode === 'flat'
            ? this.models.map((model) => this.renderModel(model))
            : this.renderHierarchicalModels(this.modelsHierarchy)}
        </div>
      </div>
    `;
  }

  private renderModel(model: Model): TemplateResult {
    return html`
      <div class="model-item">
        <div class="model-item-header">
          <span>${model.name || model.key}</span>
          <span class="model-type">${model.type}</span>
        </div>
        <div class="model-details">
          ${this.renderModelDetails(model)}
        </div>
      </div>
    `;
  }

  private renderModelDetails(model: Model): TemplateResult {
    return html`
      <ul class="property-list">
        ${Object.entries(model).map(
          ([key, value]) => html`
            <li class="property-item">
              <span class="property-key">${key}:</span>
              <span class="property-value">${this.renderValue(value)}</span>
            </li>
          `
        )}
      </ul>
    `;
  }

  private renderValue(value: any): string {
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    } else {
      return String(value);
    }
  }

  private renderHierarchicalModels(
    hierarchicalItem: HierarchicalItem<Model> | null,
    level: number = 0
  ): TemplateResult {
    if (!hierarchicalItem) return html``;

    return html`
      <div class="level-wrap">
        ${this.renderModel(hierarchicalItem)}
        ${hierarchicalItem.children.map((child) =>
          this.renderHierarchicalModels(child, level + 1)
        )}
      </div>
    `;
  }

  private toggleViewMode() {
    this.viewMode = this.viewMode === 'flat' ? 'hierarchical' : 'flat';
  }
}