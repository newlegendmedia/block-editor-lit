import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { libraryStore, ModelLibrary } from '../library/libraryStore';
import { blockStore } from './BlockStore';

import './DocumentBlock';
import '../util/DebugToggle';
import './PathRenderer';
import './Breadcrumbs';
import '../util/ThemeSwitcher';

@customElement('app-component')
export class AppComponent extends LitElement {
  @state() private libraryReady: boolean = false;
  @state() private openDocuments: string[] = [];
  @state() private library: ModelLibrary | null = null;
  @state() private currentPath: string = '';

  private unsubscribeLibrary: (() => void) | null = null;

  static styles = css`
    :host {
      display: block;
      font-family: Arial, sans-serif;
    }
    .app-view {
      margin-top: 20px;
      max-width: 940px;
      margin-left: auto;
      margin-right: auto;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.unsubscribeLibrary = libraryStore.subscribe((library, ready) => {
      this.library = library;
      this.libraryReady = ready;
      if (this.libraryReady && this.openDocuments.length === 0) {
        this.openNewDocument();
      }
      this.requestUpdate();
    });

    this.addEventListener('path-clicked', this.handlePathClicked as EventListener);
    this.addEventListener('breadcrumb-clicked', this.handleBreadcrumbClicked as EventListener);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.unsubscribeLibrary) {
      this.unsubscribeLibrary();
    }
    this.removeEventListener('path-clicked', this.handlePathClicked as EventListener);
    this.removeEventListener('breadcrumb-clicked', this.handleBreadcrumbClicked as EventListener);
  }

  private handlePathClicked(e: CustomEvent) {
    const clickedPath = e.detail.path;
    this.currentPath = clickedPath;
    this.requestUpdate();
  }

  private handleBreadcrumbClicked(e: CustomEvent) {
    const clickedPath = e.detail.path;
    this.currentPath = clickedPath;
    this.requestUpdate();
  }

  private openNewDocument() {
    const newDocId = this.initializeDocument();
    this.openDocuments = [...this.openDocuments, newDocId];
    this.currentPath = newDocId;
  }

  private initializeDocument(): string {
    if (!this.library) {
      console.error('Library not initialized');
      return '';
    }

    const notionModel = this.library.getDefinition('notion', 'object');

    if (!notionModel) {
      console.error('Notion definition not found');
      return '';
    }

    const rootBlock = blockStore.createBlockFromModel(notionModel);

    const document = {
      id: 'notionDoc' + Date.now(),
      title: 'New Notion++ Document',
      rootBlock: rootBlock.id,
    };

    blockStore.setDocument(document);
    return document.id;
  }

  render() {
    if (!this.libraryReady) {
      return html`<div>Loading library...</div>`;
    }

    return html`
    <div class="app-view">
      <theme-switcher></theme-switcher>
      <button @click=${() => this.openNewDocument()}>New Document</button>
      <debug-toggle></debug-toggle>
      <h-breadcrumbs .path=${this.currentPath}></h-breadcrumbs>
      <path-renderer .path=${this.currentPath}></path-renderer>
    </div>
    `;
  }
}