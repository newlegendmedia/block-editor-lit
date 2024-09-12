import { LitElement, html, PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { Content, ContentId } from "../content/content";
import { Model } from "../model/model";
import { contentStore } from "../resourcestore/";
import { modelStore } from "../modelstore/ModelStoreInstance";
import "../components/Breadcrumbs";

export abstract class BaseBlock extends LitElement {
  @property({ type: String }) contentId: ContentId = "";
  @property({ type: String }) path: string = "";
  @state() protected content?: Content;
  @state() protected model?: Model;
  @state() protected error: string | null = null;

  private unsubscribeContent: (() => void) | null = null;
  private initialized: boolean = false;

  constructor() {
    super();
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.initialize();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribeFromContent();
  }

  protected generateComponentPath(path: string): string {
    return `${path}.${this.model?.key}`;
  }

  protected async initialize() {
    if (this.initialized) return;

    try {
      await this.initializeContent();
      this.subscribeToContent();
      await this.initializeModel();
      this.path = this.generateComponentPath(this.path);
      console.log(
        "=== BaseBlock initialize",
        this.path,
        this.content,
        this.model,
      );
      await this.initializeBlock();
      this.initialized = true;
    } catch (error) {
      console.error("Initialization error:", error);
      this.error = `Initialization failed: ${
        error instanceof Error ? error.message : String(error)
      }`;
    }
  }

  protected async initializeBlock() {
    // This method is intentionally left empty in the base class
  }

  protected async initializeContent() {
    this.content = await contentStore.get(this.contentId);
  }

  protected async initializeModel() {
    if (this.content) {
      this.model = await this.getModel();
    }

    if (!this.model) {
      throw new Error("Failed to initialize model");
    }
  }

  private subscribeToContent() {
    this.unsubscribeFromContent();
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
      console.error("Failed to update content:", error);
      this.error = "Failed to update content";
    }
  }

  protected async getModel(): Promise<Model | undefined> {
    if (!this.content) return undefined;

    const { modelInfo } = this.content;
    if (this.content.modelDefinition) return this.content.modelDefinition;
    if (!modelInfo.ref) return undefined;

    return modelStore.getDefinition(modelInfo.ref, modelInfo.type);
  }

  protected updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
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
      <div style="font-size:11px; margin-bottom:5px;">${this.contentId}</div>
      <div>${this.renderContent()}</div>
    `;
  }

  protected abstract renderContent(): unknown;

  protected renderPath() {
    return html`
      <h-breadcrumbs
        .path=${this.path}
        @breadcrumb-clicked=${this.handleBreadcrumbClick}
      ></h-breadcrumbs>
    `;
  }

  private handleBreadcrumbClick(e: CustomEvent) {
    const clickedPath = e.detail.path;
    this.dispatchEvent(
      new CustomEvent("path-clicked", {
        detail: { path: clickedPath },
        bubbles: true,
        composed: true,
      }),
    );
  }
}
