import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { TreeStateController } from '../controllers/TreeStateController';
import type { ModelStateController } from '../controllers/ModelStateController';
import type { IListProperty, Property, IModelProperty, IElementProperty, IGroupProperty } from '../types/types';
import { isElement, isModel, isList, isGroup } from '../types/ModelDefinition';
import { AtomType } from '../types/types';

@customElement('block-component')
export class BlockComponent extends LitElement {
  @property({ type: Object }) modelProperty!: Property;
  @property({ type: String }) path!: string;
  @property({ type: Object }) treeStateController!: TreeStateController;
  @property({ type: Object }) modelStateController!: ModelStateController;

  render() {
    const content = this.treeStateController.getContentByPath(this.path);
    
    return html`
      <div class="block">
        <h3>${this.modelProperty.label || this.modelProperty.key}</h3>
        ${this.renderContent(content)}
      </div>
    `;
  }

  renderContent(content: any) {
    if (isElement(this.modelProperty)) {
      return this.renderElement(this.modelProperty, content);
    } else if (isModel(this.modelProperty)) {
      return this.renderModel(this.modelProperty, content);
    } else if (isList(this.modelProperty)) {
      return this.renderList(this.modelProperty, content);
    } else if (isGroup(this.modelProperty)) {
      return this.renderGroup(this.modelProperty, content);
    } else {
      return html`<p>Unsupported property type</p>`;
    }
  }

  renderElement(property: IElementProperty, content: any) {
    if (!property.atom) return null;
    switch (property.atom) {
      case AtomType.Text:
        return html`<input type="text" .value=${content || ''} @input=${this.handleInput}>`;
      case AtomType.Number:
        return html`<input type="number" .value=${content || ''} @input=${this.handleInput}>`;
      case AtomType.Boolean:
        return html`<input type="checkbox" .checked=${content || false} @change=${this.handleInput}>`;
      // Add cases for other atom types as needed
      default:
        return html`<p>Unsupported atom type: ${property.atom}</p>`;
    }
  }

  renderModel(property: IModelProperty, _content: any) {
    if (!isModel(property)) {
      console.error('Invalid property type passed to renderModel');
      return null;
    }
    return html`
      <div class="model-content">
        ${property.properties?.map(prop => 
          html`<block-component
            .modelProperty=${prop}
            .path=${`${this.path}.${prop.key}`}
            .treeStateController=${this.treeStateController}
            .modelStateController=${this.modelStateController}
          ></block-component>`
        )}
      </div>
    `;
  }

  renderList(property: IListProperty, content: any) {
    if (!Array.isArray(content)) content = [];
    return html`
      <div class="list-content">
        ${content.map((_item: any, index: number) => 
          html`<block-component
            .modelProperty=${property.items}
            .path=${`${this.path}[${index}]`}
            .treeStateController=${this.treeStateController}
            .modelStateController=${this.modelStateController}
          ></block-component>`
        )}
        <button @click=${this.handleAddListItem}>Add Item</button>
      </div>
    `;
  }

  renderGroup(property: IGroupProperty, _content: any) {
    return html`
      <div class="group-content">
        ${property.items.map(prop => 
          html`<block-component
            .modelProperty=${prop}
            .path=${`${this.path}.${prop.key}`}
            .treeStateController=${this.treeStateController}
            .modelStateController=${this.modelStateController}
          ></block-component>`
        )}
      </div>
    `;
  }

  handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    this.treeStateController.setContentByPath(this.path, value);
  }

  handleAddListItem() {
    const currentContent = this.treeStateController.getContentByPath(this.path) || [];
    this.treeStateController.setContentByPath(this.path, [...currentContent, {}]);
  }
}