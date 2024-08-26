import { LitElement, html, css, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Document, DocumentId } from '../content/content';

@customElement('sidebar-component')
export class SidebarComponent extends LitElement {
  @property({ type: Array }) documents: Document[] = [];
  @property({ type: String }) activeDocumentId: DocumentId | null = null;

  static styles = css`
    :host {
      display: block;
      padding: 10px;
    }
    ul {
      list-style-type: none;
      padding: 0;
    }
    li {
      cursor: pointer;
      padding: 5px 0;
    }
    li.active {
      font-weight: bold;
    }
    button {
      margin-top: 10px;
    }
  `;

  render(): TemplateResult {
    return html`
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
      <button @click=${this.createNewDocument}>New Document</button>
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
}