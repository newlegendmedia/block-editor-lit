import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { contentStore } from '../store/ContentStore';
import { Content, Document } from '../content/content';

@customElement('content-store-viewer')
export class ContentStoreViewer extends LitElement {
  @state() private contents: Map<string, Content> = new Map();
  @state() private documents: Document[] = [];

  private unsubscribe: (() => void) | null = null;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background-color: var(--background-color);
      color: var(--text-color);
      overflow: hidden;
      font-size: var(--font-size-small);
    }
    .content-store-viewer {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
      padding: 10px;
    }
    .content-list, .document-list {
      flex-grow: 1;
      overflow-y: auto;
      margin-top: var(--spacing-small);
    }
    .content-item, .document-item {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xsmall);
      padding: var(--spacing-small);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      margin-bottom: var(--spacing-small);
    }
    .content-id, .document-id {
      font-weight: bold;
    }
    .content-details, .document-details {
      white-space: pre-wrap;
      font-family: monospace;
      font-size: var(--font-size-small);
    }
    h3 {
      margin: 0 0 var(--spacing-medium) 0;
    }
  `;

  async connectedCallback() {
    super.connectedCallback();
    this.unsubscribe = contentStore.subscribeToAllChanges(this.handleContentChange.bind(this));
    await this.updateContents();
    this.updateDocuments();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  private handleContentChange(change: { type: 'add' | 'update' | 'delete', id: string, content?: Content }) {
    switch (change.type) {
      case 'add':
      case 'update':
        if (change.content) {
          this.contents.set(change.id, change.content);
        }
        break;
      case 'delete':
        this.contents.delete(change.id);
        break;
    }
    this.requestUpdate();
  }

  private async updateContents() {
    this.contents = await contentStore.getAllActiveContents();
    this.requestUpdate();
  }

  private updateDocuments() {
    this.documents = contentStore.getActiveDocuments();
    this.requestUpdate();
  }

  render() {
    return html`
      <div class="content-store-viewer">
        <h3>Content Store</h3>
        <div>Content Count: ${this.contents.size}</div>
        <div>Document Count: ${this.documents.length}</div>
        <h4>Documents</h4>
        <div class="document-list">
          ${this.documents.map(doc => this.renderDocument(doc))}
        </div>
        <h4>Contents</h4>
        <div class="content-list">
          ${Array.from(this.contents.values()).map(content => this.renderContent(content))}
        </div>
      </div>
    `;
  }

  private renderDocument(doc: Document) {
    return html`
      <div class="document-item">
        <div class="document-id">${doc.id}</div>
        <div>Title: ${doc.title}</div>
        <div>Root Block: ${doc.rootBlock}</div>
        <div>Created: ${doc.createdAt}</div>
        <div>Updated: ${doc.updatedAt}</div>
      </div>
    `;
  }

  private renderContent(content: Content) {
    return html`
      <div class="content-item">
        <div class="content-id">${content.id}</div>
        <div>${content.modelInfo.type} | ${content.modelInfo.key}</div>
        ${content.modelInfo.ref ? html`<div>Model Ref: ${content.modelInfo.ref}</div>` : ''}
        <div class="content-details">${JSON.stringify(content.content, null, 2)}</div>
        <div>${JSON.stringify(content.modelInfo)}</div>
      </div>
    `;
  }
}