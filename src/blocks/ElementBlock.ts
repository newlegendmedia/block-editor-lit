import { html, css, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseBlock } from './BaseBlock';
import { ElementModel, AtomType } from '../model/model';

@customElement('element-block')
export class ElementBlock extends BaseBlock {
  @property({ type: Boolean }) isInline: boolean = false;

  static styles = [
    BaseBlock.styles,
    css`
      input {
        width: 100%;
        padding: 5px;
        margin: 5px 0;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        padding: var(--spacing-small);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        background-color: var(--background-color);
        color: var(--text-color)
      }
    `,
  ];

  protected async initializeContent() {
    await super.initializeContent();
    if (this.isInline) {
      this.initializeInlineElement();
    }
  }

  private initializeInlineElement() {
    const elementModel = this.model as ElementModel;
    const initialValue = this.getDefaultValue(elementModel);
    this.dispatchEvent(new CustomEvent('element-updated', {
      detail: { id: this.contentId, value: initialValue },
      bubbles: true,
      composed: true
    }));
  }

  private getDefaultValue(model: ElementModel): any {
    switch (model.base) {
      case AtomType.Text:
        return '';
      case AtomType.Number:
        return 0;
      case AtomType.Boolean:
        return false;
      case AtomType.Datetime:
        return new Date().toISOString();
      default:
        return null;
    }
  }

  protected renderContent(): TemplateResult {
    if (!this.content) {
      return html`<div>Loading...</div>`;
    }

    const elementModel = this.model as ElementModel;
    const content = this.content.content;
    const isReadonly = false;

    return html`
      <div>
        <label>${elementModel.name || elementModel.key}:</label>
        ${this.renderInputElement(elementModel, content, isReadonly)}
      </div>
    `;
  }

  private renderInputElement(
    model: ElementModel,
    content: any,
    isReadonly: boolean
  ): TemplateResult {
    switch (model.base) {
      case AtomType.Text:
        return this.renderTextElement(content, isReadonly);
      case AtomType.Number:
        return this.renderNumberElement(content, isReadonly);
      case AtomType.Boolean:
        return this.renderBooleanElement(content, isReadonly);
      case AtomType.Datetime:
        return this.renderDatetimeElement(content, isReadonly);
      default:
        return html`<div>Unsupported element type: ${model.base}</div>`;
    }
  }

  private renderTextElement(content: string, isReadonly: boolean): TemplateResult {
    return html`
      ${isReadonly
        ? html`<span>${content || ''}</span>`
        : html`<input type="text" .value=${content || ''} @input=${this.handleInput} />`}
    `;
  }

  private renderNumberElement(content: number, isReadonly: boolean): TemplateResult {
    return html`
      ${isReadonly
        ? html`<span>${content || ''}</span>`
        : html`<input type="number" .value=${content || ''} @input=${this.handleInput} />`}
    `;
  }

  private renderBooleanElement(content: boolean, isReadonly: boolean): TemplateResult {
    return html`
      ${isReadonly
        ? html`<span>${content ? 'Yes' : 'No'}</span>`
        : html`<input type="checkbox" .checked=${content || false} @change=${this.handleInput} />`}
    `;
  }

  private renderDatetimeElement(content: string, isReadonly: boolean): TemplateResult {
    return html`
      ${isReadonly
        ? html`<span>${content || ''}</span>`
        : html`<input type="datetime-local" .value=${content || ''} @input=${this.handleInput} />`}
    `;
  }

  private handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    
    this.updateContent(content => ({
      ...content,
      content: value
    }));
  }
}