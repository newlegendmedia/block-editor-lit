import { LitElement, html, css, TemplateResult } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import type { ArrayProperty } from './model';
import { ComponentFactory } from './app';
import { UnifiedLibrary } from './ModelLibrary';

@customElement('array-component')
export class ArrayComponent extends LitElement {
  @property({ type: Object }) model!: ArrayProperty;
  @property({ type: Array }) data: any[] = [];
  @property({ type: Object }) library!: UnifiedLibrary;

  get repeatable(): boolean {
    return this.model.repeatable || false;
  }
  
  static styles = css`
    :host {
      display: block;
      margin-bottom: 10px;
      border: 1px solid #ddd;
      padding: 10px;
    }
    .array-item {
      margin-bottom: 5px;
    }
  `;

  render(): TemplateResult {
    return html`
      <div>
        <h3>${this.model.name}</h3>
        ${repeat(this.data || [], (item, index) => index, (item, index) => html`
          <div class="array-item">
            ${ComponentFactory.createComponent(this.model.itemType, item.value, this.library)}
            ${this.repeatable ? html`<button @click=${() => this.removeItem(index)}>Remove</button>` : ''}
          </div>
        `)}
        ${this.repeatable ? html`<button @click=${this.addItem}>Add ${this.model.itemType.name || 'Item'}</button>` : ''}
      </div>
    `;
  }

  private addItem() {
    const newItem = ComponentFactory.createEmptyItem(this.model.itemType);
    this.data = [...this.data, newItem];
    this.requestUpdate();
    this.dispatchEvent(new CustomEvent('value-changed', {
      detail: { key: this.model.key, value: this.data },
      bubbles: true,
      composed: true
    }));
  }

  private removeItem(index: number) {
    this.data = this.data.filter((_, i) => i !== index);
    this.requestUpdate();
    this.dispatchEvent(new CustomEvent('value-changed', {
      detail: { key: this.model.key, value: this.data },
      bubbles: true,
      composed: true
    }));
  }

  protected handleValueChanged(e: CustomEvent) {
    const { key, value } = e.detail;
    const index = parseInt(key);
    if (!isNaN(index)) {
      const newData = [...this.data];
      newData[index] = value;
      this.data = newData;
      this.dispatchEvent(new CustomEvent('value-changed', {
        detail: { key: this.model.key, value: this.data },
        bubbles: true,
        composed: true
      }));
    }
  }
}