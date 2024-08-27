import { LitElement, html, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ComponentFactory } from '../util/ComponentFactory';
import { contentStore } from '../store/ContentStore';
import { documentManager } from '../store/DocumentManager';
import { libraryStore } from '../model/libraryStore';
import { Document, Content } from '../content/content';

@customElement('document-component')
export class DocumentComponent extends LitElement {
  @property({ type: String }) documentId!: string;
  @state() private document: Document | undefined = undefined;
  @state() private rootContent: Content | undefined = undefined;
  @state() private rootComponent: TemplateResult | undefined = undefined;

  async connectedCallback() {
    super.connectedCallback();
    await this.loadDocument();
  }

  async loadDocument() {
    try {
      // First, check if the document is already active in the ContentStore
      if (!contentStore.isDocumentActive(this.documentId)) {
        // If not active, load it from the DocumentManager and open it in the ContentStore
        const document = await documentManager.getDocument(this.documentId);
        if (document) {
          await contentStore.openDocument(document);
        } else {
          throw new Error('Document not found');
        }
      }

      // Now the document should be active, so we can retrieve it and its content
      this.document = contentStore.getActiveDocuments().find(doc => doc.id === this.documentId);
      if (this.document) {
        this.rootContent = await contentStore.getContent(this.document.rootBlock);
        if (this.rootContent) {
          this.rootComponent = await ComponentFactory.createComponent(
            this.rootContent.id,
            libraryStore.value,
            `document.${this.documentId}.root`
          );
        }
      }
    } catch (error) {
      console.error('Error loading document:', error);
    }
    this.requestUpdate();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // Close the document when the component is removed from the DOM
    if (this.documentId) {
      contentStore.closeDocument(this.documentId);
    }
  }

  render() {
    if (!this.document || !this.rootContent) {
      return html`<div>Loading document...</div>`;
    }

    return html`
      <h1>${this.document.title}</h1>
      ${this.rootComponent}
    `;
  }
}