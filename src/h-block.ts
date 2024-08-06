import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('h-block')
export class Block extends LitElement {
  @property({ type: String }) name: string;

  static styles = css`
    :host {
      display: block;
      padding: 16px;
      background-color: #f0f0f0;
      border-radius: 8px;
    }

    p {
      color: pink;
      border-radius: 0px;
    }
  `;

  constructor() {
    super();
    this.name = 'World';
  }

  render() {
    return html`<p>Hello, ${this.name}!</p>`;
  }
}