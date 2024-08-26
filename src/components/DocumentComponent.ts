import { LitElement, html, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ComponentFactory } from '../util/ComponentFactory';
import { contentStore } from '../store/ContentStore';
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
      this.document = await contentStore.getDocument(this.documentId);
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