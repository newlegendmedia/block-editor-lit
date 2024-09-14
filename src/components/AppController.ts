// AppController.ts
import { LitElement, html } from 'lit';
import { documentManager } from '../store';
import { loadDefaultSchema } from '../modelstore/loadDefaultSchema';
import { AppState, initialState } from './AppState';

export class AppController {
	private host: LitElement;
	private state: AppState;

	constructor(host: LitElement) {
		this.host = host;
		this.state = initialState;
	}

	setState(newState: Partial<AppState>) {
		this.state = { ...this.state, ...newState };
		this.host.requestUpdate();
	}

	async initializeApp() {
		try {
			this.setState({ isLoading: true });
			await loadDefaultSchema();
		} catch (error) {
			console.error('Failed to initialize the app:', error);
		} finally {
			this.setState({ isLoading: false });
		}
	}

	toggleSidebar = () => {
		this.setState({ isSidebarOpen: !this.state.isSidebarOpen });
	};

	toggleTheme = () => {
		const newIsDarkMode = !this.state.isDarkMode;
		this.setState({ isDarkMode: newIsDarkMode });
		document.body.classList.toggle('dark-theme', newIsDarkMode);
	};

	handleDocumentOpened = (event: CustomEvent) => {
		console.log('Document opened:', event.detail.documentId);
		this.setState({
			activeDocumentId: event.detail.documentId,
			currentPath: null,
		});
	};

	handleDocumentClosed = (event: CustomEvent) => {
		if (this.state.activeDocumentId === event.detail.documentId) {
			this.setState({
				activeDocumentId: null,
				currentPath: null,
			});
		}
	};

	handleDocumentDeleted = (event: CustomEvent) => {
		if (this.state.activeDocumentId === event.detail.documentId) {
			this.setState({
				activeDocumentId: null,
				currentPath: null,
			});
		}
	};

	handlePathClick = (event: CustomEvent) => {
		this.setState({
			currentPath: event.detail.path,
			pathRenderError: null,
		});
	};

	handleBreadcrumbClick = async (event: CustomEvent) => {
		const clickedPath = event.detail.path;
		const pathParts = clickedPath.split('.');
		if (pathParts.length === 1 && pathParts[0].startsWith('DOC-')) {
			await this.handleDocumentIdOnly(pathParts[0]);
		} else {
			this.setState({
				currentPath: clickedPath,
				activeDocumentId: null,
				pathRenderError: null,
			});
		}
	};

	handleDocumentIdOnly = async (documentId: string) => {
		this.setState({ isLoading: true });
		try {
			const document = await documentManager.getDocument(documentId);
			if (document) {
				this.setState({
					activeDocumentId: documentId,
					currentPath: documentId,
				});
			} else {
				console.error(`Document not found for ID: ${documentId}`);
				this.setState({
					pathRenderError: `Document not found for ID: ${documentId}`,
				});
			}
		} catch (error) {
			console.error('Error loading document:', error);
			this.setState({
				pathRenderError: `Error loading document: ${error}`,
			});
		} finally {
			this.setState({ isLoading: false });
		}
	};

	renderMainContent() {
		html`Active - ${this.state.activeDocumentId}`;
		if (this.state.activeDocumentId) {
			return html`
				<h-breadcrumbs
					.path=${this.state.currentPath || this.state.activeDocumentId}
				></h-breadcrumbs>
				<document-component .documentId=${this.state.activeDocumentId}></document-component>
			`;
		} else if (this.state.currentPath) {
			return html`
				<h-breadcrumbs .path=${this.state.currentPath}></h-breadcrumbs>
				<path-renderer
					.path=${this.state.currentPath}
					@render-error=${(e: CustomEvent) => {
						this.setState({ pathRenderError: e.detail.error });
					}}
				></path-renderer>
				${this.state.pathRenderError
					? html`<div class="error">Error rendering path: ${this.state.pathRenderError}</div>`
					: ''}
			`;
		} else {
			return html`<p>Select or create a document to begin.</p>`;
		}
	}
}
