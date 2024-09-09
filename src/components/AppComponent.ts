import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { DocumentId } from '../content/content';
import { loadDefaultSchema } from '../modelstore/loadDefaultSchema';
import './DocumentComponent';
import './SidebarComponent';
import './PathRenderer';
import './Breadcrumbs';

@customElement('app-component')
export class AppComponent extends LitElement {
	@state() private activeDocumentId: DocumentId | null = null;
	@state() private isSidebarOpen: boolean = true;
	@state() private isDarkMode: boolean = false;
	@state() private currentPath: string | null = null;
	@state() private pathRenderError: string | null = null;
	@state() private isLoading: boolean = false;

	static styles = css`
		:host {
			display: flex;
			height: 100vh;
			overflow: hidden;
			color: var(--text-color);
			background-color: var(--background-color);
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
		this.addEventListener('toggle-sidebar', this.toggleSidebar as EventListener);
		this.addEventListener('toggle-theme', this.toggleTheme as EventListener);
		this.addEventListener('path-clicked', this.handlePathClick as EventListener);
		this.addEventListener('breadcrumb-clicked', this.handleBreadcrumbClick as EventListener);
		this.addEventListener('document-opened', this.handleDocumentOpened as EventListener);
		this.addEventListener('document-closed', this.handleDocumentClosed as EventListener);
		this.addEventListener('document-deleted', this.handleDocumentDeleted as EventListener);
	}

	async connectedCallback() {
		super.connectedCallback();
		await this.initializeApp();
		this.applyTheme();
	}

	private async initializeApp() {
		try {
			this.isLoading = true;
			await loadDefaultSchema();
		} catch (error) {
			console.error('Failed to initialize the app:', error);
		} finally {
			this.isLoading = false;
		}
	}

	private handleDocumentOpened(event: CustomEvent) {
		this.activeDocumentId = event.detail.documentId;
		this.currentPath = null;
		this.requestUpdate();
	}

	private handleDocumentClosed(event: CustomEvent) {
		if (this.activeDocumentId === event.detail.documentId) {
			this.activeDocumentId = null;
			this.currentPath = null;
		}
		this.requestUpdate();
	}

	private handleDocumentDeleted(event: CustomEvent) {
		if (this.activeDocumentId === event.detail.documentId) {
			this.activeDocumentId = null;
			this.currentPath = null;
		}
		this.requestUpdate();
	}

	private toggleSidebar() {
		this.isSidebarOpen = !this.isSidebarOpen;
	}

	private toggleTheme() {
		this.isDarkMode = !this.isDarkMode;
		this.applyTheme();
	}

	private applyTheme() {
		document.body.classList.toggle('dark-theme', this.isDarkMode);
	}

	private handlePathClick(event: CustomEvent) {
		this.currentPath = event.detail.path;
		this.pathRenderError = null;
		this.requestUpdate();
	}

	private handleBreadcrumbClick(event: CustomEvent) {
		this.currentPath = event.detail.path;
		this.pathRenderError = null;
		this.requestUpdate();
	}

	render() {
		return html`
			<button class="toggle-sidebar" @click=${this.toggleSidebar}>
				${this.isSidebarOpen ? '←' : '→'}
			</button>
			<button class="theme-toggle" @click=${this.toggleTheme}>
				${this.isDarkMode ? '☀️' : '🌙'}
			</button>
			<div class="sidebar ${this.isSidebarOpen ? '' : 'closed'}">
				<sidebar-component></sidebar-component>
			</div>
			<div class="main-content">
				${this.isLoading ? html`<div>Loading...</div>` : this.renderMainContent()}
			</div>
		`;
	}

	private renderMainContent() {
		if (this.currentPath) {
			return html`
				<h-breadcrumbs .path=${this.currentPath}></h-breadcrumbs>
				<path-renderer
					.path=${this.currentPath}
					@render-error=${(e: CustomEvent) => {
						this.pathRenderError = e.detail.error;
					}}
				></path-renderer>
				${this.pathRenderError
					? html`<div class="error">Error rendering path: ${this.pathRenderError}</div>`
					: ''}
			`;
		} else if (this.activeDocumentId) {
			return html`<document-component .documentId=${this.activeDocumentId}></document-component>`;
		} else {
			return html`<p>Select or create a document to begin.</p>`;
		}
	}
}
