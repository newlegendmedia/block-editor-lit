import { LitElement, html } from 'lit';
import { SchemaStorage } from '../model/SchemaStorage';
import { UniversalPath } from '../path/UniversalPath';
import { AppState, initialState } from './AppState';
import { documentManager } from './DocumentManager';

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
		const path = UniversalPath.fromDocumentId(event.detail.documentId);
		this.setState({
			activeDocumentId: event.detail.documentId,
			currentPath: path.toString(),
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
		const clickedPath = event.detail.path;
		this.setState({
			currentPath: clickedPath,
			pathRenderError: null,
		});
	};

	handleBreadcrumbClick = (event: CustomEvent) => {
		const clickedPath = new UniversalPath(event.detail.path);
		this.setState({
			currentPath: clickedPath.toString(),
			activeDocumentId: null,
			pathRenderError: null,
		});
	};

	handleDocumentIdOnly = async (event: CustomEvent) => {
		const documentId = event.detail.documentId;
		this.setState({ isLoading: true });
		try {
			const document = await documentManager.getDocument(documentId);
			if (document) {
				const path = UniversalPath.fromDocumentId(documentId);
				this.setState({
					activeDocumentId: documentId,
					currentPath: path.toString(),
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
		const currentPath = this.state.currentPath ? new UniversalPath(this.state.currentPath) : null;
		if (this.state.activeDocumentId && currentPath?.segments.length === 0) {
			return html`
				<h-breadcrumbs
					.path=${currentPath || UniversalPath.fromDocumentId(this.state.activeDocumentId)}
				></h-breadcrumbs>
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
