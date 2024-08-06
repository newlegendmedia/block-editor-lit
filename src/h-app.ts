import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('h-app')
export class AppLayout extends LitElement {
  static styles = css`
    :host {
      display: grid;
      grid-template-areas:
        "topbar topbar"
        "sidebar main";
      grid-template-rows: auto 1fr;
      grid-template-columns: auto 1fr;
      height: 100vh;
      width: 100vw;
      margin: 0;
      padding: 0;
      overflow: hidden; /* Prevent scrolling on the host element */
    }

    .topbar {
      grid-area: topbar;
      background-color: #f0f0f0;
      padding: 10px;
    }

    .sidebar {
      grid-area: sidebar;
      background-color: #e0e0e0;
      width: 200px;
      padding: 10px;
      overflow-y: auto; /* Allow vertical scrolling if content overflows */
    }

    .main-content {
      grid-area: main;
      padding: 10px;
      overflow: auto; /* Allow scrolling in main content area if needed */
    }

    /* Ensure full-size layout */
    :host,
    :root,
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
    }
  `;

  @property({ type: Boolean })
  sidebarOpen = true;

  render() {
    return html`
      <div class="topbar">
        <slot name="topbar"></slot>
      </div>
      ${this.sidebarOpen ? html`
        <div class="sidebar">
          <slot name="sidebar"></slot>
        </div>
      ` : ''}
      <div class="main-content">
        <slot name="main"></slot>
      </div>
    `;
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  connectedCallback() {
    super.connectedCallback();
    this.setupFullSizeLayout();
  }

  setupFullSizeLayout() {
    // Ensure the body and html elements don't introduce extra space
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    document.documentElement.style.overflow = 'hidden';
  }
}