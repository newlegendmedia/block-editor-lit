// BaseBlock.ts
import { LitElement, html, PropertyValues, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Content, ContentId } from '../content/content';
import { Model } from '../model/model';
import { contentStore } from '../store';
import { ModelLibrary, libraryStore } from '../model/libraryStore';
import { DebugController } from '../util/DebugController';

export abstract class BaseBlock extends LitElement {
  @property({ type: String }) contentId: ContentId = '';
  @property({ type: String }) path: string = '';
  @property({ type: Object }) inlineModel?: Model;
  @property({ type: Boolean }) isInline: boolean = false;
  @state() protected content?: Content;
  @state() protected model?: Model;
  @state() protected error: string | null = null;
  @state() protected library?: ModelLibrary;

  private unsubscribe: (() => void) | null = null;
  protected debugController: DebugController;

  constructor() {
    super();
    this.debugController = new DebugController(this);
  }

  async connectedCallback() {
    super.connectedCallback();
    this.library = libraryStore.value;
    await this.initialize();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribeFromContent();
  }

  protected async initialize() {
    try {
      if (!this.isInline) {
        await this.initializeContent();
        this.subscribeToContent();
      }
      await this.initializeModel();
      await this.initializeBlock();
    } catch (error) {
      console.error('Initialization error:', error);
      this.error = `Initialization failed: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  protected async initializeContent() {
    if (!this.contentId) {
      throw new Error('ContentId is not set');
    }
    this.content = await contentStore.getContent(this.contentId);
    if (!this.content) {
      throw new Error('Content not found');
    }
  }

  protected async initializeModel() {
    if (this.isInline) {
      this.model = this.inlineModel;
    } else if (this.content) {
      this.model = this.getModel();
    }

    if (!this.model) {
      throw new Error('Failed to initialize model');
    }
  }

  protected async initializeBlock() {
    // Override in subclasses if needed
  }

  private subscribeToContent() {
    if (this.isInline) return;  // Don't subscribe for inline children
    this.unsubscribeFromContent();
    this.unsubscribe = contentStore.subscribeToContent(this.contentId, (content) => {
      this.content = content;
      this.requestUpdate();
    });
  }

  private unsubscribeFromContent() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  protected async updateContent(updater: (content: Content) => Content) {
    if (this.isInline) {
      console.warn('Attempted to update content for an inline child. Use element-updated event instead.');
      return;
    }
    if (!this.content) return;
    try {
      await contentStore.updateContent(this.content.id, updater);
    } catch (error) {
      console.error('Failed to update content:', error);
      this.error = 'Failed to update content';
    }
  }

  protected getModel(): Model | undefined {
    if (this.inlineModel) return this.inlineModel;
    if (!this.content) return undefined;

    const { modelInfo, modelDefinition } = this.content;
    if (modelDefinition) return modelDefinition;
    if (!modelInfo.ref || !this.library) return undefined;

    return this.library.getDefinition(modelInfo.ref, modelInfo.type);
  }

  protected updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    this.debugController.setDebugInfo({
      content: this.content,
      model: this.model,
      path: this.path,
      isInline: this.isInline
    });
  }

  render(): TemplateResult {
    if (this.error) {
      return html`<div class="error">${this.error}</div>`;
    }
    if (!this.isInline && !this.content || !this.model) {
      return html`<div>Loading...</div>`;
    }
    return html`
      ${this.renderDebug()}
      ${this.renderPath()}
      <div>${this.renderContent()}</div>
    `;
  }

  protected abstract renderContent(): TemplateResult;

  protected renderPath(): TemplateResult {
    return html`
      <div class="path-display" @click=${this.handlePathClick}>Current Path: ${this.path}</div>
    `;
  }

  private handlePathClick(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('path-clicked', {
      detail: { path: this.path },
      bubbles: true,
      composed: true,
    }));
  }

  protected renderDebug(): TemplateResult {
    return html`
      ${this.debugController.renderDebugButton()}
      ${this.debugController.renderDebugInfo()}
    `;
  }
}