import { LitElement, html, css, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { ComponentFactory } from './app.ts';
import type { ObjectProperty } from './model.ts';
import { UnifiedLibrary } from './ModelLibrary.ts';


@customElement('object-component')
export class ObjectComponent extends LitElement {
  @property({ type: Object }) model!: ObjectProperty;
  @property({ type: Object }) data: any;
  @property({ type: Object }) library!: UnifiedLibrary;

  static styles = css`
    :host {
      display: block;
      margin-bottom: 10px;
      border: 1px solid #ddd;
      padding: 10px;
    }
  `;

  render(): TemplateResult {
    return html`
      <div>
        <h2>${this.model.name}</h2>
        ${repeat(this.model.properties || [], prop => prop.key!, prop => 
          ComponentFactory.createComponent(prop, this.data?.[prop.key!], this.library)
        )}
      </div>
    `;
  }

  protected handleValueChanged(e: CustomEvent) {
    const { key, value } = e.detail;
    this.data = { ...this.data, [key]: value };
    this.dispatchEvent(new CustomEvent('value-changed', { 
      detail: { key: this.model.key, value: this.data },
      bubbles: true,
      composed: true
    }));
  }
}