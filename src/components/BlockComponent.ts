import { LitElement, html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import type { BlockData, SimplifiedModelDefinition } from '../types/ModelDefinition';

@customElement('block-component')
export class BlockComponent extends LitElement {
  @property({ type: String }) path!: string;
  @property({ type: Object }) blockData!: BlockData;
  @property({ type: Object }) modelDefinition!: SimplifiedModelDefinition;

  render() {
    console.log(`BlockComponent render started for path: ${this.path}`);
    console.log(`BlockData:`, this.blockData);
    console.log(`ModelDefinition:`, this.modelDefinition);

    const result = html`
      <div class="block" block-type="${this.modelDefinition.type}">
        ${this.renderBlockContent()}
        ${this.renderChildBlocks()}
      </div>
    `;

    console.log(`BlockComponent render completed for path: ${this.path}`);
    return result;
  }

  private renderBlockContent() {
    console.log(`Rendering block content for ${this.path}`);
    console.log(`Block type: ${this.modelDefinition.type}`);
    
    let content;
    switch(this.modelDefinition.type) {
      case 'element':
        content = this.renderElementBlock();
        break;
      case 'model':
        content = this.renderModelBlock();
        break;
      case 'list':
        content = this.renderListBlock();
        break;
      case 'group':
        content = this.renderGroupBlock();
        break;
      default:
        console.warn(`Unknown block type: ${this.modelDefinition.type}`);
        content = html``;
    }
    
    console.log('Rendered content:', content);
    return content;
  }

  private renderElementBlock() {
    return html`
      <div class="element-block">
        <label>${this.modelDefinition.label}</label>
        <input type="text" .value=${this.blockData.content || ''} @input=${this.handleInput} />
      </div>
    `;
  }

  private renderModelBlock() {
    console.log('Rendering model block');
    return html`
      <div class="model-block">
        <h3>${this.modelDefinition.label}</h3>
        <p>Model Content: ${JSON.stringify(this.blockData.content)}</p>
      </div>
    `;
  }

  private renderListBlock() {
    return html`
      <div class="list-block">
        <h3>${this.modelDefinition.label}</h3>
        <button @click=${this.handleAddItem}>Add Item</button>
      </div>
    `;
  }

  private renderGroupBlock() {
    return html`
      <div class="group-block">
        <h3>${this.modelDefinition.label}</h3>
      </div>
    `;
  }

  private renderChildBlocks() {
    console.log(`Rendering child blocks for ${this.path}`);
    // We'll implement this later when we handle child blocks
    return html``;
  }

  private handleInput(e: Event) {
    const input = e.target as HTMLInputElement;
    // We need to implement a way to update the content
    // This might involve calling a method on a controller
    console.log(`Update content to: ${input.value}`);
  }

  private handleAddItem() {
    // We need to implement adding an item to a list
    console.log('Add item to list');
  }
}