import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('h-breadcrumbs')
export class Breadcrumbs extends LitElement {
  @property({ type: String }) path: string = '';

  static styles = css`
    :host {
      display: block;
      margin-bottom: 5px;
      font-size: 14px;
    }
    .breadcrumbs-container {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      padding: 5px;
      background-color: #f0f0f0;
      border-radius: 4px;
    }
    .breadcrumb {
      cursor: pointer;
      color: #0077cc;
    }
    .breadcrumb:hover {
      text-decoration: underline;
    }
    .separator {
      margin: 0 6px;
      color: #666;
    }
    .current {
      color: #333;
    }
  `;

  render() {
    const parts = this.path.split('.');
    return html`
      <div class="breadcrumbs-container">
        ${parts.map((part, index) => {
          const currentPath = parts.slice(0, index + 1).join('.');
          const isLast = index === parts.length - 1;
          return html`
            ${index > 0 ? html`<span class="separator">/</span>` : ''}
            <span 
              class=${isLast ? 'current' : 'breadcrumb'}
              @click=${() => this.handleClick(currentPath)}
            >${part}</span>
          `;
        })}
      </div>
    `;
  }

  private handleClick(path: string) {
    this.dispatchEvent(new CustomEvent('breadcrumb-clicked', {
      detail: { path },
      bubbles: true,
      composed: true
    }));
  }
}