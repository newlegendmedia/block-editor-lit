import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { libraryStore, UnifiedLibrary } from '../library/libraryStore';
import { blockStore } from './BlockStore';

import './DocumentBlock';
import '../util/DebugToggle';

@customElement('app-component')
export class AppComponent extends LitElement {
  @state() private libraryReady: boolean = false;
  @state() private openDocuments: string[] = []; // List of open document IDs
  @state() private library: UnifiedLibrary | null = null;

  private unsubscribeLibrary: (() => void) | null = null;

  static styles = css`
    :host {
      display: block;
      font-family: Arial, sans-serif;
    }
    .document-container {
      margin-top: 20px;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.unsubscribeLibrary = libraryStore.subscribe((library, ready) => {
      this.library = library;
      this.libraryReady = ready;
      if (this.libraryReady && this.openDocuments.length === 0) {
        this.openNewDocument(); // Open initial document
      }
      this.requestUpdate();
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.unsubscribeLibrary) {
      this.unsubscribeLibrary();
    }
  }

  private openNewDocument() {
    const newDocId = this.initializeDocument();
    this.openDocuments = [...this.openDocuments, newDocId];
  }

  private initializeDocument(): string {
    if (!this.library) return '';

    console.log('Initializing document...');

    const notionModel = this.library.getDefinition('notion', 'object');
    console.log('Notion model:', notionModel);
    if (!notionModel) {
      console.error('Notion definition not found');
      return '';
    }
    const rootBlock = blockStore.createBlockFromModel(notionModel);

    const document = {
      id: 'notionDoc' + Date.now(), // Unique ID based on timestamp
      title: 'New Notion++ Document',
      rootBlock: rootBlock.id,
    };

    blockStore.setDocument(document);
    console.log('Document initialized:', document);
    return document.id;
  }

  render() {
    if (!this.libraryReady) {
      return html`<div>Loading library...</div>`;
    }

	  return html`
      <button @click=${() => this.openNewDocument()}>New Document</button>
		<debug-toggle></debug-toggle>
      <div class="document-container">
        ${this.openDocuments.map(
          (docId) => html`<document-component .documentId=${docId}></document-component>`
        )}
      </div>
    `;
  }
}