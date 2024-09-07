import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Document } from '../content/content';
import { documentManager } from '../store';

@customElement('documents-viewer')
export class DocumentsViewer extends LitElement {
  @state() private documents: Document[] = [];
  @state() private activeDocumentId: string | null = null;

  static styles = css`
    :host {
      display: block;
      margin-bottom: 20px;
    }
    .document-list {
      list-style-type: none;
      padding: 0;
    }
    .document-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 5px 0;
    }
    .document-title {
      cursor: pointer;
    }
    .document-title.active {
      font-weight: bold;
    }
    .document-controls {
      display: flex;
      gap: 5px;
    }
    button {
      background-color: var(--primary-color);
      color: white;
      border: none;
      padding: 5px 10px;
      cursor: pointer;
      border-radius: 3px;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.loadDocuments();
  }

  async loadDocuments() {
    this.documents = await documentManager.getAllDocuments();
    this.requestUpdate();
  }

  render() {
    return html`
      <div>
        <h3>Documents</h3>
        <ul class="document-list">
          ${this.documents.map(doc => this.renderDocumentItem(doc))}
        </ul>
        <button @click=${this.createNewDocument}>New Document</button>
      </div>
    `;
  }

  private renderDocumentItem(doc: Document) {
    return html`
      <li class="document-item">
        <span 
          class="document-title ${doc.id === this.activeDocumentId ? 'active' : ''}"
          @click=${() => this.openDocument(doc.id)}
        >
          ${doc.title}
        </span>
        <div class="document-controls">
          <button @click=${() => this.closeDocument(doc.id)}>Close</button>
          <button @click=${() => this.deleteDocument(doc.id)}>Delete</button>
        </div>
      </li>
    `;
  }

  private async createNewDocument() {
    const newDoc = await documentManager.createDocument('New Document');
    await this.loadDocuments();
    this.openDocument(newDoc.id);
  }

  private async openDocument(id: string) {
    await documentManager.activateDocument(id);
    this.activeDocumentId = id;
    await this.loadDocuments();
    this.dispatchEvent(new CustomEvent('document-opened', { detail: { documentId: id } }));
  }

  private async closeDocument(id: string) {
    await documentManager.closeDocument(id);
    if (this.activeDocumentId === id) {
      this.activeDocumentId = null;
    }
    await this.loadDocuments();
    this.dispatchEvent(new CustomEvent('document-closed', { detail: { documentId: id } }));
  }

  private async deleteDocument(id: string) {
    await documentManager.deleteDocument(id);
    if (this.activeDocumentId === id) {
      this.activeDocumentId = null;
    }
    await this.loadDocuments();
    this.dispatchEvent(new CustomEvent('document-deleted', { detail: { documentId: id } }));
  }
}