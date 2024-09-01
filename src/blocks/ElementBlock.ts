import { html, css, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { BaseBlock } from './BaseBlock';
import { ElementModel, AtomType } from '../model/model';

@customElement('element-block')
export class ElementBlock extends BaseBlock {
  @property({ type: Object }) inlineValue: any = null;

  @state() private localValue: any = null;

  static styles = [
    css`
      input {
        width: 100%;
        padding: 5px;
        margin: 5px 0;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        background-color: var(--background-color);
        color: var(--text-color)
      }
    `,
  ];

  async connectedCallback() {
    await super.connectedCallback();
    await this.initializeLocalValue();
    this.requestUpdate();
  }

  protected async initializeLocalValue() {
    if (this.isInline) {
      this.localValue = this.inlineValue ?? null;
    } else {
      this.localValue = this.content?.content ?? null;
    }
  }

  protected renderContent(): TemplateResult {
    if (!this.model) {
      console.warn('ElementBlock: Model not found', { isInline: this.isInline, contentId: this.contentId });
      return html`<div>Error: Model not found</div>`;
    }

    const elementModel = this.model as ElementModel;

    return html`
      <div>
        <label>${elementModel.name || elementModel.key || 'Unnamed Element'}:</label>
        ${this.renderInputElement(elementModel, this.localValue)}
      </div>
    `;
  }

  private renderInputElement(model: ElementModel, content: any): TemplateResult {
    switch (model.base) {
      case AtomType.Text:
        return this.renderTextElement(content);
      case AtomType.Number:
        return this.renderNumberElement(content);
      case AtomType.Boolean:
        return this.renderBooleanElement(content);
      case AtomType.Datetime:
        return this.renderDatetimeElement(content);
      default:
        return html`<div>Unsupported element type: ${model.base}</div>`;
    }
  }

  private renderTextElement(content: string | null): TemplateResult {
    return html`<input type="text" .value=${content ?? ''} @input=${this.handleInput} />`;
  }

  private renderNumberElement(content: number | null): TemplateResult {
    return html`<input type="number" .value=${content ?? ''} @input=${this.handleInput} />`;
  }

  private renderBooleanElement(content: boolean | null): TemplateResult {
    return html`<input type="checkbox" .checked=${content ?? false} @change=${this.handleInput} />`;
  }

  private renderDatetimeElement(content: string | null): TemplateResult {
    return html`<input type="datetime-local" .value=${content ?? ''} @input=${this.handleInput} />`;
  }

  private handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    const value = target.type === 'checkbox' ? target.checked : target.value;

    this.localValue = value;

    if (this.isInline) {
      this.dispatchEvent(new CustomEvent('element-updated', {
        detail: { id: this.contentId, value: value },
        bubbles: true,
        composed: true
      }));
    } else {
      this.updateContent(content => ({
        ...content,
        content: value
      }));
    }
  }
}