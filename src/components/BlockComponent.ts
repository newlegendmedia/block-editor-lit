import { LitElement, html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { TreeStateController } from '../controllers/TreeStateController';
import { ModelStateController } from '../controllers/ModelStateController';

@customElement('block-component')
export class BlockComponent extends LitElement {
  @property({ type: String }) path!: string;
  @property({ type: Object }) treeStateController!: TreeStateController;
  @property({ type: Object }) modelStateController!: ModelStateController;

  render() {
    const block = this.treeStateController.getBlock(this.path);
    if (!block) {
      console.warn(`BlockComponent: No block found for path: ${this.path}`);
      return html``;
    }

    const result = html`
      <div class="block" 
           block-type="${block.modelProperty.type}"
           block-key="${block.modelProperty.key}">
        ${block.render()}
        ${this.renderChildBlocks()}
      </div>
    `;
    return result;
  }

  private renderChildBlocks() {
    const childBlocks = this.treeStateController.getChildBlocks(this.path);
    const result = childBlocks.map(childBlock => html`
      <block-component
        .path=${childBlock.path}
        .treeStateController=${this.treeStateController}
        .modelStateController=${this.modelStateController}
      ></block-component>
    `);
    return result;
  }
}