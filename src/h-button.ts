import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('h-button')
export class HatchButton extends LitElement {
  @property({ type: String }) label = 'Button';
  @property({ type: String }) icon = '';
  @property({ type: Boolean }) editMode = false;

  static styles = css`
    :host {
      display: inline-block;
    }
    button {
      display: flex;
      align-items: center;
      padding: 8px 16px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
    }
    button:hover {
      background-color: #0056b3;
    }
    .icon {
      margin-right: 8px;
    }
    .editable {
      cursor: pointer;
      border: 1px dashed #ccc;
      padding: 2px;
    }
  `;

  render() {
    return html`
      <button @click=${this._handleClick}>
        ${this.editMode
          ? html`
              <span class="icon editable" @click=${this._editIcon}>${this.icon}</span>
              <span class="label editable" @click=${this._editLabel}>${this.label}</span>
            `
          : html`
              <span class="icon">${this.icon}</span>
              <span class="label">${this.label}</span>
            `
        }
      </button>
    `;
  }

  _handleClick(e: Event) {
    if (!this.editMode) {
      this.dispatchEvent(new CustomEvent('button-click', {
        bubbles: true,
        composed: true
      }));
    }
  }

  _editIcon(e: Event) {
    e.stopPropagation();
    // Implement icon editing logic here
    console.log('Editing icon');
  }

  _editLabel(e: Event) {
    e.stopPropagation();
    // Implement label editing logic here
    console.log('Editing label');
  }
}