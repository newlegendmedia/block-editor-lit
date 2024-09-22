import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { AppState, initialState } from './AppState';
import { AppController } from './AppController';
import './DocumentComponent';
import './SidebarComponent';
import './PathRenderer';
import './Breadcrumbs';

@customElement('app-component')
export class AppComponent extends LitElement {
	@state() private state: AppState = initialState;
	private controller: AppController;

	static styles = css`
		:host {
			display: flex;
			height: 100vh;
			overflow: hidden;
			color: var(--text-color);
			background-color: var(--background-color);
			margin: 0;
		}
		.sidebar {
			width: 350px;
			overflow-y: auto;
			background-color: var(--sidebar-bg-color);
			transition: transform 0.3s ease-in-out;
		}
		.sidebar.closed {
			transform: translateX(-250px);
		}
		.main-content {
			flex-grow: 1;
			overflow-y: auto;
			padding: 20px;
			max-width: 800px;
		}
		.toggle-sidebar {
			position: fixed;
			top: 10px;
			left: 10px;
			z-index: 1000;
		}
		.theme-toggle {
			position: fixed;
			top: 10px;
			right: 10px;
			z-index: 1000;
		}
	`;

	constructor() {
		super();
		this.controller = new AppController(this);
		this.addEventListener('toggle-sidebar', this.controller.toggleSidebar as EventListener);
		this.addEventListener('toggle-theme', this.controller.toggleTheme as EventListener);
		this.addEventListener('path-clicked', this.controller.handlePathClick as EventListener);
		this.addEventListener(
			'breadcrumb-clicked',
			this.controller.handleBreadcrumbClick as unknown as EventListener
		);
		this.addEventListener('document-opened', this.controller.handleDocumentOpened as EventListener);
		this.addEventListener('document-closed', this.controller.handleDocumentClosed as EventListener);
		this.addEventListener(
			'document-deleted',
			this.controller.handleDocumentDeleted as EventListener
		);
		this.addEventListener(
			'document-id-only',
			this.controller.handleDocumentIdOnly as unknown as EventListener
		);
	}

	async connectedCallback() {
		super.connectedCallback();
		await this.controller.initializeApp();
	}

	sidebarIcon() {
		return this.state.isSidebarOpen ? '←' : '→';
	}

	darkModeIcon() {
		return this.state.isDarkMode ? '☀️' : '🌙';
	}

	sidebarClasses() {
		return { closed: !this.state.isSidebarOpen };
	}

	render() {
		return this.state.isLoading
			? html`<div>App Loading...</div>`
			: html`
          <button class="toggle-sidebar" @click=${this.controller.toggleSidebar}>
            ${this.sidebarIcon()}
          </button>

          <button class="theme-toggle" @click=${this.controller.toggleTheme}>
            ${this.darkModeIcon()}
          </button>

          <div class="sidebar ${classMap(this.sidebarClasses())}">
            <sidebar-component></sidebar-component>
          </div>

          <div class="main-content">
            ${this.controller.renderMainContent()}</div>
          </div>
        `;
	}
}
