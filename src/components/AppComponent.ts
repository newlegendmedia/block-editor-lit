import { LitElement, html, css, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { contentStore } from '../store/ContentStore';
import { Document, DocumentId } from '../content/content';
import './DocumentComponent';
import './SidebarComponent';

@customElement('app-component')
export class AppComponent extends LitElement {
  @state() private documents: Document[] = [];
  @state() private activeDocumentId: DocumentId | null = null;
  @state() private isSidebarOpen: boolean = true;
  @state() private isDarkMode: boolean = false;

  static styles = css`
    :host {
      display: flex;
      height: 100vh;
      overflow: hidden;
      color: var(--text-color);
      background-color: var(--background-color);
    }
    .sidebar {
      width: 250px;
      overflow-y: auto;
      background-color: var(--sidebar-bg-color);
      transition: transform 0.3s ease-in-out;
    }
    .sidebar.closed {
      transform: translateX(-250px);
    }
    .main-content {
      flex-grow: 1;
      overflow-y: auto;
      padding: 20px;
    }
    .toggle-sidebar {
      position: fixed;
      top: 10px;
      left: 10px;
      z-index: 1000;
    }
    .theme-toggle {
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 1000;
    }
  `;

  constructor() {
    super();
    this.addEventListener('toggle-sidebar', this.toggleSidebar as EventListener);
    this.addEventListener('toggle-theme', this.toggleTheme as EventListener);
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.loadDocuments();
    this.applyTheme();
  }

  private async loadDocuments() {
    try {
      this.documents = await contentStore.getAllDocuments();
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  }

  private async createNewDocument() {
    try {
      const newDocument = await contentStore.createDocument('New Document');
      this.documents = [...this.documents, newDocument];
      this.activeDocumentId = newDocument.id;
    } catch (error) {
      console.error('Failed to create new document:', error);
    }
  }

  private setActiveDocument(id: DocumentId) {
    this.activeDocumentId = id;
  }

  private toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  private toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    this.applyTheme();
  }

  private applyTheme() {
    document.body.classList.toggle('dark-theme', this.isDarkMode);
  }

  render(): TemplateResult {
    return html`
      <button class="toggle-sidebar" @click=${this.toggleSidebar}>
        ${this.isSidebarOpen ? '←' : '→'}
      </button>
      <button class="theme-toggle" @click=${this.toggleTheme}>
        ${this.isDarkMode ? '☀️' : '🌙'}
      </button>
      <div class="sidebar ${this.isSidebarOpen ? '' : 'closed'}">
        <sidebar-component
          .documents=${this.documents}
          .activeDocumentId=${this.activeDocumentId}
          @document-selected=${(e: CustomEvent) => this.setActiveDocument(e.detail.documentId)}
          @new-document=${this.createNewDocument}
        ></sidebar-component>
      </div>
      <div class="main-content">
        ${this.activeDocumentId 
          ? html`<document-component .documentId=${this.activeDocumentId}></document-component>`
          : html`<p>Select or create a document to begin.</p>`
        }
      </div>
    `;
  }
}