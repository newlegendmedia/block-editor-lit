import { LitElement, html, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { until } from "lit/directives/until.js";
import {
  Content,
  ContentId,
  isIndexedCompositeContent,
  isKeyedCompositeContent,
} from "../content/content";
import { contentStore } from "../resourcestore";
import {
  isIndexedCompositeModel,
  isKeyedCompositeModel,
  isElement,
  isObject,
  Model,
} from "../model/model";
import { ComponentFactory } from "../util/ComponentFactory";
import { modelStore } from "../modelstore/ModelStoreInstance";
import { ReactiveController } from "lit";

class PathController implements ReactiveController {
  private host: PathRenderer;
  private _path: string = "";
  private _targetContentId: string | null = null;
  private _error: string | null = null;
  private _targetContent: Content | null = null;
  private _isLoading: boolean = false;

  constructor(host: PathRenderer) {
    this.host = host;
    this.host.addController(this);
  }

  set path(newPath: string) {
    if (this._path !== newPath) {
      this._path = newPath;
      this.findTargetContent();
    }
  }

  get path(): string {
    return this._path;
  }

  get targetContentId(): string | null {
    return this._targetContentId;
  }

  get error(): string | null {
    return this._error;
  }

  get targetContent(): Content | null {
    return this._targetContent;
  }

  get isLoading(): boolean {
    return this._isLoading;
  }

  hostConnected() {
    // Initialize if needed
  }

  private async findTargetContent() {
    this._isLoading = true;
    this._error = null;
    this._targetContentId = null;
    this._targetContent = null;
    this.host.requestUpdate();

    const pathParts = this._path.split(".");

    if (pathParts.length === 0) {
      this._error = "Invalid path";
      this._isLoading = false;
      this.host.requestUpdate();
      return;
    }

    try {
      if (pathParts.length === 1 && pathParts[0].startsWith("DOC-")) {
        // If only document ID is provided, emit an event to handle it in the AppComponent
        this.host.dispatchEvent(
          new CustomEvent("document-id-only", {
            detail: { documentId: pathParts[0] },
            bubbles: true,
            composed: true,
          }),
        );
        this._isLoading = false;
        this.host.requestUpdate();
        return;
      }

      // Handle nested content
      const rootContentKey = pathParts[1];
      let currentContent: Content | undefined =
        await this.findRootContent(rootContentKey);

      if (!currentContent) {
        throw new Error(`Root content not found for key: ${rootContentKey}`);
      }

      for (let i = 2; i < pathParts.length; i++) {
        const part = pathParts[i];
        const childId = await this.getChildId(currentContent, part);

        if (!childId) {
          throw new Error(`Child content not found for key: ${part}`);
        } else {
        }

        if (childId.startsWith("inline:")) {
          this._targetContentId = childId;
          this._targetContent = currentContent;
          break;
        }

        currentContent = await contentStore.get(childId);

        if (!currentContent) {
          throw new Error(`Content not found for id: ${childId}`);
        }
      }

      if (currentContent) {
        this._targetContentId = currentContent.id;
        this._targetContent = currentContent;
      }
    } catch (error) {
      console.error("Error in findTargetContent:", error);
      this._error = error instanceof Error ? error.message : String(error);
    } finally {
      this._isLoading = false;
      this.host.requestUpdate();
    }
  }

  private async findRootContent(rootKey: string): Promise<Content | undefined> {
    // Fetch all contents and find the one with matching modelInfo.key
    const allContents = await contentStore.getAll();
    return allContents.find((content) => content.modelInfo.key === rootKey);
  }

  private async getModelForBlock(block: Content): Promise<Model | undefined> {
    return (
      block.modelDefinition ||
      (await modelStore.getDefinition(
        block.modelInfo.ref!,
        block.modelInfo.type,
      ))
    );
  }

  private async getChildId(
    content: Content,
    pathPart: string,
  ): Promise<ContentId | undefined> {
    const model = await this.getModelForBlock(content);

    if (!model) {
      console.error(`Model not found for block: ${content.id}`);
      return undefined;
    }
    const childKey = pathPart;
    if (isIndexedCompositeModel(model)) {
      const index = parseInt(childKey, 10);
      if (isIndexedCompositeContent(content)) {
        console.log(
          "isIndexedCompositeContent content",
          index,
          pathPart,
          content,
        );
        if (!isNaN(index) && index >= 0 && index < content.children.length) {
          return content.children[index];
        }
      }
    } else if (isKeyedCompositeModel(model)) {
      if (isKeyedCompositeContent(content)) {
        // Handle keyed composite (object)
        if (isObject(model) && model.inlineChildren) {
          const childProperty = model.properties.find(
            (prop) => prop.key === childKey,
          );
          if (childProperty && isElement(childProperty)) {
            const childContentId = `inline:${content.id}:${childKey}`;
            return childContentId;
          }
        }
        return content.content[pathPart];
      }
    }
    return undefined;
  }
}

@customElement("path-renderer")
export class PathRenderer extends LitElement {
  private pathController: PathController;

  @property({ type: String })
  set path(newPath: string) {
    this.pathController.path = newPath;
  }

  get path(): string {
    return this.pathController.path;
  }

  constructor() {
    super();
    this.pathController = new PathController(this);
  }

  render() {
    return html`
      <div>
        <p>PathRenderer is active. Current path: ${this.path}</p>
        <div>Target Content: ${this.pathController.targetContentId}</div>
        ${this.pathController.error
          ? html`<div class="error">Error: ${this.pathController.error}</div>`
          : this.pathController.targetContentId
            ? html`<div>
                ${until(
                  this.renderTargetContent(),
                  html`<div>Loading content...</div>`,
                  html`<div>Error loading content</div>`,
                )}
              </div>`
            : html`<div>Loading...</div>`}
      </div>
    `;
  }

  private async renderTargetContent(): Promise<TemplateResult> {
    if (!this.pathController.targetContentId)
      return html`<div>No target content found</div>`;

    if (this.pathController.targetContentId.startsWith("inline:")) {
      return html`<div>Path not supported for inline content</div>`;
    }

    const content = this.pathController.targetContent;
    if (!content) return html`<div>Content not found</div>`;

    // remove the last item from the path if it matches the content.modelInfo.key to avoid duplication
    const pathParts = this.path.split(".");

    if (pathParts[pathParts.length - 1] === content.modelInfo.key) {
      pathParts.pop();
    }
    const parentPath = pathParts.join(".");

    return ComponentFactory.createComponent(
      content.id || this.pathController.targetContentId,
      parentPath,
    );
  }
}
