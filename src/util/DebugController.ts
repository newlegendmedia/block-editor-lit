import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { globalDebugState } from './debugState';

@customElement('debug-controller')
export class DebugControllerComponent extends LitElement {
  @state() private showDebugButtons: boolean = false;

  private debugStateListener: () => void;

  constructor() {
    super();
    this.debugStateListener = () => {
      this.showDebugButtons = globalDebugState.showDebugButtons;
      this.requestUpdate();
    };
  }

  connectedCallback() {
    super.connectedCallback();
    globalDebugState.addListener(this.debugStateListener);
    this.showDebugButtons = globalDebugState.showDebugButtons;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    globalDebugState.removeListener(this.debugStateListener);
  }

  static styles = css`
    :host {
      display: block;
      margin-bottom: 10px;
    }
button {      
  background-color: var(--secondary-color);
  color: white;
  border: none;
  padding: var(--spacing-small) var(--spacing-medium);
  margin-bottom: var(--spacing-small);
  cursor: pointer;
  border-radius: var(--border-radius);
}
  `;

  render() {
    return html`
      <button @click=${this.toggleDebugButtons}>
        ${this.showDebugButtons ? 'Hide' : 'Show'} All Debug Buttons
      </button>
    `;
  }

  private toggleDebugButtons() {
    globalDebugState.showDebugButtons = !globalDebugState.showDebugButtons;
  }
}