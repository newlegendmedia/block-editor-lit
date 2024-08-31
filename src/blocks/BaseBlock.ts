// baseBlock.ts

import { LitElement, html, css, PropertyValues, TemplateResult, CSSResultGroup } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Content, ContentId, CompositeContent } from '../content/content';
import { Model } from '../model/model';
import { contentStore } from '../store';
import { ModelLibrary, libraryStore } from '../model/libraryStore';
import { DebugController } from '../util/DebugController';
import { ContentFactory } from '../store/ContentFactory';

export abstract class BaseBlock extends LitElement {
  @property({ type: String }) contentId: ContentId = '';
  @property({ type: String }) path: string = '';
  @property({ type: Object }) inlineModel?: Model;
  @state() protected content?: Content;
  @state() protected model?: Model;
  @state() protected error: string | null = null;
  @state() protected library?: ModelLibrary;
  @state() private isModelReady: boolean = false;

  private unsubscribe: (() => void) | null = null;
  protected debugController: DebugController;

  static styles = css`
    /* ... existing styles ... */
  ` as CSSResultGroup;

  constructor() {
    super();
    this.debugController = new DebugController(this);
  }

  async connectedCallback() {
    super.connectedCallback();
    this.library = libraryStore.value;
    await this.initializeContent();
    this.subscribeToContent();
    await this.initializeModel();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  protected async initializeContent() {
    if (!this.contentId) {
      throw new Error('ContentId is not set');
    }

    try {
      this.content = await contentStore.getContent(this.contentId);
      if (!this.content) {
        // If content doesn't exist, create it
        const model = this.getModel();
        if (!model) {
          throw new Error('Model not found for content creation');
        }
        const { modelInfo, modelDefinition, content } = ContentFactory.createContentFromModel(model);
        this.content = await contentStore.createContent(modelInfo, modelDefinition, content);
        this.contentId = this.content.id;
      }
    } catch (error) {
      console.error('Failed to initialize content:', error);
      throw error;
    }
  }

  private async initializeModel() {
    this.model = this.getModel();
    if (!this.model) {
      throw new Error('Failed to initialize model');
    }
    this.isModelReady = true;
    this.requestUpdate();
  }


  private subscribeToContent() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.unsubscribe = contentStore.subscribeToContent(this.contentId, (content) => {
      this.content = content || undefined;  // Convert null to undefined
      this.requestUpdate();
    });
  }

  protected async updateContent(updater: (content: Content) => Content | CompositeContent) {
    if (!this.content) return;
  
    try {
      const updatedContent = updater(this.content);
      await contentStore.updateContent(this.content.id, () => updatedContent);
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
      console.warn(`${this.tagName}: Cannot get model - content is missing`);
      return undefined;
    }

    const { modelInfo, modelDefinition } = this.content;

    if (modelDefinition) {
      return modelDefinition;
    }

    if (!modelInfo.ref) {
      console.warn(`${this.tagName}: Cannot get model - modelRef is missing`);
      return undefined;
    }

    const library = libraryStore.value;
    if (!library) {
      console.warn(`${this.tagName}: Cannot get model - library is missing`);
      return undefined;
    }

    const model = library.getDefinition(modelInfo.ref, modelInfo.type);
    if (!model) {
      console.warn(`${this.tagName}: Model not found for key ${modelInfo.ref}`);
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
    if (!this.isModelReady) {
      return html`<div>Loading...</div>`;
    }

    return html`
      ${this.renderDebug()} ${this.renderError()} ${this.renderPath()}
      <div>${this.renderContent()}</div>
    `;
  }

  protected renderPath(): TemplateResult {
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

  protected abstract renderContent(): TemplateResult;

  protected renderDebug(): TemplateResult {
    return html`
      ${this.debugController.renderDebugButton()} ${this.debugController.renderDebugInfo()}
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