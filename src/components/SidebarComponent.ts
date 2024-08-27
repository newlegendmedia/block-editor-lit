import { LitElement, html, css, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Document, DocumentId } from '../content/content';
import './ContentStoreViewer'; // Make sure to import the ContentStoreViewer

@customElement('sidebar-component')
export class SidebarComponent extends LitElement {
  @property({ type: Array }) documents: Document[] = [];
  @property({ type: String }) activeDocumentId: DocumentId | null = null;
  @state() private isContentStoreViewerVisible: boolean = false;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 10px;
      box-sizing: border-box;
    }
    .document-list {
      flex-grow: 1;
      overflow-y: auto;
    }
    ul {
      list-style-type: none;
      padding: 0;
      margin: 0;
    }
    li {
      cursor: pointer;
      padding: 5px 0;
    }
    li.active {
      font-weight: bold;
    }
    .button-container {
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
      margin-bottom: 10px;
    }
    button {
      padding: 5px 10px;
    }
    .content-store-viewer-container {
      margin-top: 20px;
      border-top: 1px solid var(--border-color);
      padding-top: 10px;
    }
  `;

  render(): TemplateResult {
    return html`
      <div class="document-list">
        <ul>
          ${this.documents.map(doc => html`
            <li
              class=${doc.id === this.activeDocumentId ? 'active' : ''}
              @click=${() => this.selectDocument(doc.id)}
            >
              ${doc.title}
            </li>
          `)}
        </ul>
      </div>
      <div class="button-container">
        <button @click=${this.createNewDocument}>New Document</button>
        <button @click=${this.toggleContentStoreViewer}>
          ${this.isContentStoreViewerVisible ? 'Hide' : 'Show'} Content Store
        </button>
      </div>
      ${this.isContentStoreViewerVisible ? html`
        <div class="content-store-viewer-container">
          <content-store-viewer></content-store-viewer>
        </div>
      ` : ''}
    `;
  }

  private selectDocument(id: DocumentId) {
    this.dispatchEvent(new CustomEvent('document-selected', {
      detail: { documentId: id },
      bubbles: true,
      composed: true
    }));
  }

  private createNewDocument() {
    this.dispatchEvent(new CustomEvent('new-document', {
      bubbles: true,
      composed: true
    }));
  }

  private toggleContentStoreViewer() {
    this.isContentStoreViewerVisible = !this.isContentStoreViewerVisible;
  }
}