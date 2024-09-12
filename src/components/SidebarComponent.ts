import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import "./DocumentsViewer";
import "./ContentStoreViewer";
import "./ModelStoreViewer";

@customElement("sidebar-component")
export class SidebarComponent extends LitElement {
  @state() private isContentStoreViewerVisible: boolean = false;
  @state() private isModelStoreViewerVisible: boolean = false;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 10px;
      box-sizing: border-box;
    }
    .store-viewer-container {
      margin-top: 20px;
      border-top: 1px solid var(--border-color);
      padding-top: 10px;
    }
  `;

  render() {
    return html`
      <documents-viewer
        @document-opened=${this.propagateEvent}
        @document-closed=${this.propagateEvent}
        @document-deleted=${this.propagateEvent}
      ></documents-viewer>
      <button @click=${this.toggleContentStoreViewer}>
        ${this.isContentStoreViewerVisible ? "Hide" : "Show"} Content Store
      </button>
      ${this.isContentStoreViewerVisible
        ? html`
            <div class="store-viewer-container">
              <content-store-viewer></content-store-viewer>
            </div>
          `
        : ""}
      <button @click=${this.toggleModelStoreViewer}>
        ${this.isModelStoreViewerVisible ? "Hide" : "Show"} Model Store
      </button>
      ${this.isModelStoreViewerVisible
        ? html`
            <div class="store-viewer-container">
              <model-store-viewer></model-store-viewer>
            </div>
          `
        : ""}
    `;
  }

  private propagateEvent(e: CustomEvent) {
    this.dispatchEvent(
      new CustomEvent(e.type, {
        detail: e.detail,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private toggleContentStoreViewer() {
    this.isContentStoreViewerVisible = !this.isContentStoreViewerVisible;
  }

  private toggleModelStoreViewer() {
    this.isModelStoreViewerVisible = !this.isModelStoreViewerVisible;
  }
}
