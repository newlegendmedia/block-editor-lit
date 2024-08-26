import { LitElement, html, css, PropertyValues, TemplateResult, CSSResultGroup } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Content, ContentId, ModelInfo } from '../content/content';
import { Model } from '../model/model';
import { contentStore } from '../store/ContentStore';
import { ModelLibrary, libraryStore } from '../model/libraryStore';
import { DebugController } from '../util/DebugController';

export abstract class BaseBlock extends LitElement {
  @property({ type: String }) contentId: ContentId = '';
  @property({ type: String }) path: string = '';
  @property({ type: Object }) inlineModel?: Model;
  @state() protected model?: Model;
  @state() protected content?: Content;
  @state() protected error: string | null = null;
  @state() protected library: ModelLibrary;

  private unsubscribe: (() => void) | null = null;
  protected debugController: DebugController;

  static styles = css`
    :host {
      display: block;
      margin-bottom: var(--spacing-medium);
      border: 1px solid var(--border-color);
      padding: var(--spacing-medium);
      border-radius: var(--border-radius);
    }

    .error {
      color: red;
      margin-bottom: var(--spacing-small);
    }

    .debug-info {
      background-color: var(--debug-bg-color, #f4f7f9);
      border: 1px solid var(--debug-border-color, #dae0e3);
      border-radius: 4px;
      color: var(--debug-text-color, #212529);
      font-family: 'Courier New', Courier, monospace;
      font-size: 14px;
      line-height: 1.5;
      margin-top: 20px;
      padding: 16px;
      overflow: hidden;
    }

    .path-display {
      font-size: 0.8em;
      margin-bottom: 10px;
      padding: var(--spacing-small);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      background-color: var(--background-color);
      color: var(--text-color);
      cursor: pointer;
      transition: background-color 0.3s;
      display: inline-block;
    }

    .path-display:hover {
      background-color: #e0e0e0;
    }
  `as CSSResultGroup;

  constructor() {
    super();
    this.library = libraryStore.value;
    this.debugController = new DebugController(this);
  }

  async connectedCallback() {
    super.connectedCallback();
//    await this.initializeContent();
    this.subscribeToContent();
    this.model = this.getModel();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  protected async initializeContent() {
    if (!this.contentId) {
      console.error('ContentId is not set');
      return;
    }

    try {
      this.content = await contentStore.getContent(this.contentId);
      if (!this.content) {
        // If content doesn't exist, create it
        const model = this.getModel();
        if (!model) {
          throw new Error('Model not found for content creation');
        }
        const modelInfo: ModelInfo = {
          type: model.type,
          key: model.key,
          ref: 'ref' in model ? model.ref : undefined
        };
        this.content = await contentStore.createContent(model);
        this.contentId = this.content.id;
      }
    } catch (error) {
      console.error('Failed to initialize content:', error);
      this.error = 'Failed to initialize content';
    }
  }

  private subscribeToContent() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.unsubscribe = contentStore.observe(this.contentId, (content) => {
      this.content = content;
//      this.requestUpdate();
    });
  }

  protected async updateContent(updater: (content: Content) => Content) {
    if (!this.content) return;

    try {
      await contentStore.updateContent(this.content.id, updater);
    } catch (error) {
      console.error('Failed to update content:', error);
      this.error = 'Failed to update content';
    }
  }

  protected getModel(): Model | undefined {
    if (this.inlineModel) {
      return this.inlineModel;
    }

    if (!this.content) {
      console.error(`${this.tagName}: Cannot get model - content is missing`);
      return undefined;
    }

    const { modelInfo, modelDefinition } = this.content;

    if (modelDefinition) {
      return modelDefinition;
    }

    if (!modelInfo.ref) {
      console.error(`${this.tagName}: Cannot get model - modelRef is missing`);
      return undefined;
    }

    const library = libraryStore.value;
    if (!library) {
      console.error(`${this.tagName}: Cannot get model - library is missing`);
      return undefined;
    }

    const model = library.getDefinition(modelInfo.ref, modelInfo.type);
    if (!model) {
      console.error(`${this.tagName}: Model not found for key ${modelInfo.ref}`);
    }
    return model;
  }

  protected updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    this.debugController.setDebugInfo({
      content: this.content,
      model: this.model,
      path: this.path,
    });
  }

  render(): TemplateResult {
    return html`
      ${this.renderDebug()}
      ${this.renderError()}
      ${this.renderPath()}
      <div>${this.renderContent()}</div>
    `;
  }

  protected renderPath(): TemplateResult {
    return html`
      <div class="path-display" @click=${this.handlePathClick}>Current Path: ${this.path}</div>
    `;
  }

  private handlePathClick(e: Event) {
    e.stopPropagation(); // Prevent event from bubbling up
    this.dispatchEvent(
      new CustomEvent('path-clicked', {
        detail: { path: this.path },
        bubbles: true,
        composed: true,
      })
    );
  }

  protected abstract renderContent(): TemplateResult;

  protected renderDebug(): TemplateResult {
    return html`
      ${this.debugController.renderDebugButton()}
      ${this.debugController.renderDebugInfo()}
    `;
  }

  protected renderError(): TemplateResult {
    if (!this.error) {
      return html``;
    }
    return html`<div class="error">${this.error}</div>`;
  }

  protected setError(message: string) {
    this.error = message;
  }

  protected clearError() {
    this.error = null;
  }
}