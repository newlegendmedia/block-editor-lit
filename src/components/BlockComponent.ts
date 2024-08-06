// BlockComponent.ts
import { LitElement, html, css, PropertyValues } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { BaseBlock } from '../blocks/BaseBlock';
import { TreeStateController } from '../controllers/TreeStateController';
import { ModelStateController } from '../controllers/ModelStateController';
import { Property } from '../types/ModelDefinition';

@customElement('block-component')
export class BlockComponent extends LitElement {
  @property({ type: Object }) block!: BaseBlock;
  @property({ type: Object }) treeStateController!: TreeStateController;
  @property({ type: Object }) modelStateController!: ModelStateController;

  static styles = css`
    :host {
      display: block;
      margin-bottom: 10px;
    }
  `;

  protected updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    if (changedProperties.has('block')) {
      this.block.host = this;
    }
  }

  render() {
    return html`
      <div class="block">
        ${this.renderBlockContent()}
      </div>
    `;
  }

  private renderBlockContent() {
    switch (this.block.modelProperty.type) {
      case 'element':
        return this.renderElementBlock();
      case 'model':
        return this.renderModelBlock();
      case 'list':
        return this.renderListBlock();
      case 'group':
        return this.renderGroupBlock();
      default:
        return html`Unknown block type`;
    }
  }

  private renderElementBlock() {
    const content = this.block.getContent();
    return html`
      <div class="element-block">
        <label>${this.block.modelProperty.label || this.block.modelProperty.key}</label>
        <input type="text" .value=${content || ''} @input=${this.handleInput}>
      </div>
    `;
  }

  private renderModelBlock() {
    const children = this.block.getChildren();
    return html`
      <div class="model-block">
        <h3>${this.block.modelProperty.label || this.block.modelProperty.key}</h3>
        ${children.map(child => html`
          <block-component
            .block=${child}
            .treeStateController=${this.treeStateController}
            .modelStateController=${this.modelStateController}
          ></block-component>
        `)}
      </div>
    `;
  }

  private renderListBlock() {
    const items = this.block.getContent() || [];
    return html`
      <div class="list-block">
        <h3>${this.block.modelProperty.label || this.block.modelProperty.key}</h3>
        <ul>
          ${items.map((item: any, index: number) => html`
            <li>
              <block-component
                .block=${this.treeStateController.getBlock(`${this.block.path}[${index}]`)}
                .treeStateController=${this.treeStateController}
                .modelStateController=${this.modelStateController}
              ></block-component>
            </li>
          `)}
        </ul>
        <button @click=${this.handleAddItem}>Add Item</button>
      </div>
    `;
  }

  private renderGroupBlock() {
    const children = this.block.getChildren();
    return html`
      <div class="group-block">
        <h3>${this.block.modelProperty.label || this.block.modelProperty.key}</h3>
        ${children.map(child => html`
          <block-component
            .block=${child}
            .treeStateController=${this.treeStateController}
            .modelStateController=${this.modelStateController}
          ></block-component>
        `)}
      </div>
    `;
  }

  private handleInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.block.setContent(input.value);
  }

  private handleAddItem() {
    const listProperty = this.block.modelProperty as Property & { items: Property };
    this.treeStateController.addChildBlock(this.block.path, listProperty.items);
  }
}