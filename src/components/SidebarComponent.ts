import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import './BlockStoreViewer';

@customElement('sidebar-component')
export class SidebarComponent extends LitElement {
  @property({ type: Array }) openDocuments: string[] = [];

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      background-color: var(--sidebar-bg-color, #f0f0f0);
      color: var(--sidebar-text-color, #333);
      padding: 20px;
      height: 100%;
      box-sizing: border-box;
    }
    .sidebar-content {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .sidebar-docs {
      background-color: var(--sidebar-docs-bg-color, #ffffff);
      color: var(--sidebar-docs-text-color, #333);
      padding: 10px;
      margin-bottom: 10px;
      border-radius: 4px;
    }
    ul {
      list-style-type: none;
      padding: 0;
    }
    li {
      margin-bottom: 10px;
      cursor: pointer;
    }
    button {
      margin-top: 20px;
      background-color: var(--button-bg-color, #007bff);
      color: var(--button-text-color, #ffffff);
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
    }
    button:hover {
      background-color: var(--button-hover-bg-color, #0056b3);
    }
    block-store-viewer {
      flex-grow: 1;
      overflow: hidden;
    }
    h2 {
      margin: 0 0 15px 0;
    }
  `;

  render() {
    return html`
      <div class="sidebar-content">
        <div class="sidebar-docs">
          <h2>Documents</h2>
          <ul>
            ${this.openDocuments.map(
              (docId) => html`<li @click=${() => this.selectDocument(docId)}>${docId}</li>`
            )}
          </ul>
          <button @click=${this.createNewDocument}>New Document</button>
        </div>
        <block-store-viewer></block-store-viewer>
      </div>
    `;
  }

  private selectDocument(docId: string) {
    this.dispatchEvent(new CustomEvent('select-document', { detail: docId, bubbles: true, composed: true }));
  }

  private createNewDocument() {
    this.dispatchEvent(new CustomEvent('create-document', { bubbles: true, composed: true }));
  }
}