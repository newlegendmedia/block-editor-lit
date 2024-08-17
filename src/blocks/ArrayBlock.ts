import { css, html, TemplateResult } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import type { ArrayProperty } from '../util/model';
import { ComponentFactory } from './app';
import { BaseBlock } from './BaseBlock';

@customElement('array-component')
export class ArrayBlock extends BaseBlock {
  @property({ type: Object }) override model!: ArrayProperty;
  @property({ type: Array }) data: any[] = [];

  static styles = [
    BaseBlock.styles,
    css``
  ];  

  get repeatable(): boolean {
    return this.model.repeatable || false;
  }

  override render(): TemplateResult {
    if (!this.model) {
      return html`<div class="error">Error: Invalid array configuration</div>`;
    }

    return html`
      <div>
        <h3>${this.model.name}</h3>
        ${repeat(this.data || [], (_item, index) => index, (item, index) => html`
          <div class="array-item">
            ${ComponentFactory.createComponent(this.model.itemType, item )}
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