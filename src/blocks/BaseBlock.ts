import { LitElement, html, PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Content, ContentId } from '../content/content';
import { Model } from '../model/model';
import { contentStore } from '../resourcestore/';
import { libraryStore, ModelStore } from '../model/libraryStore';
import { DebugController } from '../util/DebugController';

export abstract class BaseBlock extends LitElement {
  @property({ type: String }) contentId: ContentId = '';
  @property({ type: String }) path: string = '';
  @state() protected content?: Content;
  @state() protected model?: Model;
  @state() protected error: string | null = null;
  @state() protected modelStore?: ModelStore;

  private unsubscribeContent: (() => void) | null = null;
  private unsubscribeLibrary: (() => void) | null = null;
  protected debugController: DebugController;
  private initialized: boolean = false;

  constructor() {
    super();
    this.debugController = new DebugController(this);
  }

  async connectedCallback() {
    super.connectedCallback();
    ;
    this.unsubscribeLibrary = libraryStore.subscribe(this.handleLibraryChange.bind(this));
    await this.initialize();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribeFromContent();
    if (this.unsubscribeLibrary) {
      this.unsubscribeLibrary();
    }
  }

  private handleLibraryChange(modelStore: ModelStore, ready: boolean) {
    this.modelStore = modelStore;
    if (ready) {
//      this.initialize();
    }
  }

  protected async initialize() {
    if (this.initialized) return;
    
    try {
      await this.initializeContent();
      this.subscribeToContent();
      await this.initializeModel();
      await this.initializeBlock();
      this.initialized = true;
    } catch (error) {
      console.error('Initialization error:', error);
      this.error = `Initialization failed: ${
        error instanceof Error ? error.message : String(error)
      }`;
    }
  }

  protected async initializeBlock() {
    // This method is intentionally left empty in the base class
  }

  protected async initializeContent() {
    if (!this.contentId) {
      throw new Error('ContentId is not set');
    }
    this.content = await contentStore.get(this.contentId);
    if (!this.content) {
      throw new Error('Content not found');
    }
  }

  protected async initializeModel() {
    if (this.content && this.modelStore) {
      this.model = await this.getModel();
    }

    if (!this.model) {
      throw new Error('Failed to initialize model');
    }
  }

  private subscribeToContent() {
    this.unsubscribeFromContent();
    // this.unsubscribeContent = contentStore.subscribe(this.contentId, (content) => {
    //   this.content = content || undefined;
    //   this.requestUpdate();
    // });
  }

  private unsubscribeFromContent() {
    if (this.unsubscribeContent) {
      this.unsubscribeContent();
      this.unsubscribeContent = null;
    }
  }

  protected async updateContent(updater: (content: Content) => Content) {
    if (!this.content) return;
    try {
      const updatedContent = await contentStore.update(this.contentId, updater);
      if (updatedContent) {
        this.content = updatedContent;
      }
    } catch (error) {
      console.error('Failed to update content:', error);
      this.error = 'Failed to update content';
    }
  }

  protected async getModel(): Promise<Model | undefined> {
    if (!this.content || !this.modelStore) return undefined;

    const { modelInfo } = this.content;
    if (this.content.modelDefinition) {
      return this.content.modelDefinition;
    }
    if (!modelInfo.ref) return undefined;

    return await this.modelStore.getDefinition(modelInfo.ref, modelInfo.type);
  }

  protected updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    this.debugController.setDebugInfo({
      content: this.content,
      model: this.model,
      path: this.path,
    });
  }

  render() {
    if (this.error) {
      return html`<div class="error">${this.error}</div>`;
    }
    if (!this.content || !this.model) {
      return html`<div>Loading...</div>`;
    }
    return html`
      ${this.renderPath()}
      <div>${this.renderContent()}</div>
    `;
  }

  protected abstract renderContent(): unknown;

  protected renderPath() {
    return html`
      <div class="path-display" @click=${this.handlePathClick}>Current Path: ${this.path}</div>
    `;
  }

  private handlePathClick(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent('path-clicked', {
        detail: { path: this.path },
        bubbles: true,
        composed: true,
      })
    );
  }

  protected renderDebug() {
    return html`
      ${this.debugController.renderDebugButton()} ${this.debugController.renderDebugInfo()}
    `;
  }
}