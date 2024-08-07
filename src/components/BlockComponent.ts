import { LitElement, html, css, PropertyValues } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { TreeStateController } from '../controllers/TreeStateController';
import { ModelStateController } from '../controllers/ModelStateController';

@customElement('block-component')
export class BlockComponent extends LitElement {
  @property({ type: String }) path!: string;
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
    if (changedProperties.has('path') || changedProperties.has('treeStateController')) {
      const block = this.treeStateController.getBlock(this.path);
      if (block) {
        block.updateHost(this);
      }
    }
  }

  render() {
    const block = this.treeStateController.getBlock(this.path);
    if (!block) return html``;

    return html`
      <div class="block" 
           block-type="${block.modelProperty.type}"
           block-key="${block.modelProperty.key}">
        ${block.render()}
        ${this.renderChildBlocks()}
      </div>
    `;
  }

  private renderChildBlocks() {
    const childBlocks = this.treeStateController.getChildBlocks(this.path);
    return childBlocks.map(childBlock => html`
      <block-component
        .path=${childBlock.path}
        .treeStateController=${this.treeStateController}
        .modelStateController=${this.modelStateController}
      ></block-component>
    `);
  }
}