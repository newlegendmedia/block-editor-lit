import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { contentStore, Content } from '../content/ContentStore';

@customElement('block-store-viewer')
export class BlockStoreViewer extends LitElement {
  @state() private blocks: Map<string, Content> = new Map();

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background-color: var(--background-color);
      color: var(--text-color);
      overflow: hidden;
    }
    .block-store-viewer {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
      padding: 10px;
    }
    .block-list {
      flex-grow: 1;
      overflow-y: auto;
      margin-top: var(--spacing-small);
    }
    .block-item {
      margin-bottom: var(--spacing-medium);
      padding: var(--spacing-small);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
    }
    .block-id {
      font-weight: bold;
      margin-bottom: var(--spacing-small);
    }
    .block-content {
      white-space: pre-wrap;
      font-family: monospace;
      font-size: var(--font-size-small);
    }
    h3 {
      margin: 0 0 var(--spacing-medium) 0;
    }
  `;

  constructor() {
    super();
    this.updateBlocks();
  }

  connectedCallback() {
    super.connectedCallback();
    contentStore.subscribeToAllBlocks(() => this.updateBlocks());
  }

  private updateBlocks() {
    this.blocks = new Map(contentStore.getAllBlocks());
    this.requestUpdate();
  }

  render() {
    return html`
      <div class="block-store-viewer">
        <h3>Block Store Contents</h3>
        <div>Block Count: ${this.blocks.size}</div>
        <div class="block-list">
          ${Array.from(this.blocks).map(([id, block]) => html`
            <div class="block-item">
              <div class="block-id">${id}</div>
              <div>Type: ${block.type}</div>
              <div>Model Key: ${block.modelKey}</div>
              ${block.modelRef ? html`<div>Model Ref: ${block.modelRef}</div>` : ''}
              <div class="block-content">${JSON.stringify(block.content, null, 2)}</div>
            </div>
          `)}
        </div>
      </div>
    `;
  }
}