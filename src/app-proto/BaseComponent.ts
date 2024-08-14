import { LitElement, html, css, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { SimplifiedRenderTrackerMixin } from './render-tracker-mixin';
import type { Property } from './model';

@customElement('base-component')
export class BaseComponent extends SimplifiedRenderTrackerMixin(LitElement) {
  @property({ type: Object }) model!: Property;
  @property({ type: Object }) data: any;
  @state() private showDebug: boolean = false;
  @state() protected error: string | null = null;

  static styles = css`
    :host {
      display: block;
      margin-bottom: 10px;
      border: 1px solid #ddd;
      padding: 10px;
    }
    .debug-button {
      background-color: #f0f0f0;
      border: none;
      padding: 5px 10px;
      margin-bottom: 10px;
      cursor: pointer;
    }
    .debug-info {
      background-color: #f8f8f8;
      border: 1px solid #ddd;
      padding: 10px;
      white-space: pre-wrap;
      font-family: monospace;
    }
    .error {
      color: red;
      font-weight: bold;
      margin-bottom: 10px;
    }
  `;

  render(): TemplateResult {
    return html`
      ${this.error ? html`<div class="error">${this.error}</div>` : ''}
      <button class="debug-button" @click=${this.toggleDebug}>
        ${this.showDebug ? 'Hide' : 'Show'} Debug Info
      </button>
      ${this.showDebug ? this.renderDebugInfo() : ''}
      <div>${this.renderContent()}</div>
    `;
  }

  protected renderContent(): TemplateResult {
    return html`<div>${this.model.name}: ${JSON.stringify(this.data)}</div>`;
  }

  private toggleDebug() {
    this.showDebug = !this.showDebug;
  }

  private renderDebugInfo(): TemplateResult {
    const debugInfo = {
      model: this.model,
      data: this.data,
    };
    return html`
      <div class="debug-info">
        <h4>Debug Information</h4>
        <pre>${JSON.stringify(debugInfo, null, 2)}</pre>
      </div>
    `;
  }

  protected handleValueChanged(e: CustomEvent) {
    const { key, value } = e.detail;
    this.data = { ...this.data, [key]: value };
    this.dispatchEvent(
      new CustomEvent('value-changed', {
        detail: { key: this.model.key, value: this.data },
        bubbles: true,
        composed: true,
      })
    );
  }

  protected setError(message: string) {
    this.error = message;
  }

  protected clearError() {
    this.error = null;
  }
}