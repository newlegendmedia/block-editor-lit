import { LitElement, html, css, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { documentManager, storageAdapter } from '../store';
import { Document, DocumentId } from '../content/content';
import './DocumentComponent';
import './SidebarComponent';
import './PathRenderer';
import './Breadcrumbs';

@customElement('app-component')
export class AppComponent extends LitElement {
	@state() private allDocuments: Document[] = [];
	@state() private activeDocuments: Document[] = [];
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
		storageAdapter.clearAllData();
	}

	async connectedCallback() {
		super.connectedCallback();
		await this.loadDocuments();
		this.applyTheme();
	}

	private handleBreadcrumbClick(event: CustomEvent) {
		this.currentPath = event.detail.path;
		this.pathRenderError = null;
		this.requestUpdate();
	}

	private async loadDocuments() {
		try {
			this.allDocuments = await documentManager.getAllDocuments();
			this.activeDocuments = this.allDocuments.filter((doc) => doc.isActive);
		} catch (error) {
			console.error('Failed to load documents:', error);
		}
	}

	private async createNewDocument() {
		try {
			this.isLoading = true;
			const newDocument = await documentManager.createDocument('New Document', 'notion');
			this.allDocuments = [...this.allDocuments, newDocument];
			await this.openDocument(newDocument.id);
		} catch (error) {
			console.error('Failed to create new document:', error);
		} finally {
			this.isLoading = false;
		}
	}

	private async openDocument(id: DocumentId) {
		try {
			this.isLoading = true;
			const theDocument = await documentManager.getDocument(id);
			if (theDocument) {
				await documentManager.activateDocument(id);
				this.activeDocuments = this.allDocuments.filter((doc) => doc.isActive);
				this.activeDocumentId = id;

				// Update the current path to the document's root content ID
				this.currentPath = theDocument.rootContent;
			}
		} catch (error) {
			console.error('Failed to open document:', error);
		} finally {
			this.isLoading = false;
		}
	}

	private async closeDocument(id: DocumentId) {
		await documentManager.deactivateDocument(id);
		this.activeDocuments = this.allDocuments.filter((doc) => doc.isActive);
		if (this.activeDocumentId === id) {
			this.activeDocumentId = this.activeDocuments.length > 0 ? this.activeDocuments[0].id : null;
		}
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

	render(): TemplateResult {
		return html`
			<button class="toggle-sidebar" @click=${this.toggleSidebar}>
				${this.isSidebarOpen ? '←' : '→'}
			</button>
			<button class="theme-toggle" @click=${this.toggleTheme}>
				${this.isDarkMode ? '☀️' : '🌙'}
			</button>
			<div class="sidebar ${this.isSidebarOpen ? '' : 'closed'}">
				<sidebar-component
					.allDocuments=${this.allDocuments}
					.activeDocuments=${this.activeDocuments}
					.activeDocumentId=${this.activeDocumentId}
					@document-selected=${(e: CustomEvent) => this.openDocument(e.detail.documentId)}
					@document-closed=${(e: CustomEvent) => this.closeDocument(e.detail.documentId)}
					@new-document=${this.createNewDocument}
				></sidebar-component>
			</div>
			<div class="main-content">
				${this.isLoading
					? html`<div>Loading...</div>`
					: this.currentPath
					? html`
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
					  `
					: this.activeDocumentId
					? html`<document-component .documentId=${this.activeDocumentId}></document-component>`
					: html`<p>Select or create a document to begin.</p>`}
			</div>
		`;
	}
}
