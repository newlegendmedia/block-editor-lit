// DocumentBlock.ts

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ComponentFactory } from '../util/ComponentFactory';
import { blockStore, Document as DocumentType } from './BlockStore';
import { libraryStore } from '../library/libraryStore';

@customElement('document-component')
export class DocumentComponent extends LitElement {
  @property({ type: String }) documentId!: string;
  @state() private document: DocumentType | null = null;

  static styles = css`
    :host {
      display: block;
      padding: 16px;
      border: 1px solid #ccc;
      margin-bottom: 16px;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.loadDocument();
  }

  updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('documentId')) {
      this.loadDocument();
    }
  }

  private loadDocument() {
    const doc = blockStore.getDocument(this.documentId);
    if (doc) {
      this.document = doc;
    } else {
      console.error(`Document with id ${this.documentId} not found`);
    }
  }

  render() {
    if (!this.document) {
      return html`<div>Loading document...</div>`;
    }

    return html`
      <h1>${this.document.title}</h1>
      ${ComponentFactory.createComponent(this.document.rootBlock, libraryStore.value)}
    `;
  }
}