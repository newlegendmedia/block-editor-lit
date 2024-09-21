// AppController.ts
import { LitElement, html } from 'lit';
import { documentManager } from './DocumentManager';
import { SchemaStorage } from '../model/SchemaStorage';
import { AppState, initialState } from './AppState';
import { ContentPath } from '../content/ContentPath';

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
			this.toggleTheme();
			this.setState({ isLoading: true });
			await SchemaStorage.loadDefaultSchema();
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
		this.setState({
			activeDocumentId: event.detail.documentId,
			currentPath: new ContentPath(event.detail.documentId).toString(),
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
		const clickedPath = new ContentPath(event.detail.path);
		this.setState({
			currentPath: clickedPath.path,
			activeDocumentId: null,
			pathRenderError: null,
		});
	};

	// handleDocumentIdOnly = async (event: CustomEvent) => {
	// 	const documentId = event.detail.documentId;
	// 	// Load the document and update the app state
	// 	await this.loadDocument(documentId);
	// 	this.setState({
	// 		activeDocumentId: documentId,
	// 		currentPath: documentId,
	// 	});
	// };

	handleDocumentIdOnly = async (event: CustomEvent) => {
		const documentId = event.detail.documentId;
		this.setState({ isLoading: true });
		try {
			const document = await documentManager.getDocument(documentId);
			if (document) {
				const contentPath = ContentPath.fromDocumentId(documentId);
				this.setState({
					activeDocumentId: documentId,
					currentPath: contentPath.toString(),
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
		const currentPath = this.state.currentPath ? new ContentPath(this.state.currentPath) : null;
		if (this.state.activeDocumentId) {
			return html`
				<h-breadcrumbs .path=${currentPath || this.state.activeDocumentId}></h-breadcrumbs>
				<document-component .documentId=${this.state.activeDocumentId}></document-component>
			`;
		} else if (this.state.currentPath) {
			return html`
				<h-breadcrumbs .path=${currentPath}></h-breadcrumbs>
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
