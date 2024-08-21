import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { libraryStore, ModelLibrary } from '../model/libraryStore';
import { contentStore } from '../content/ContentStore';
import { Document } from '../content/content';

import './DocumentComponent';
import '../util/DebugToggle';
import './PathRenderer';
import './Breadcrumbs';
import '../util/ThemeSwitcher';
import './SidebarComponent';

@customElement('app-component')
export class AppComponent extends LitElement {
	@state() private libraryReady: boolean = false;
	@state() private openDocuments: string[] = [];
	@state() private library: ModelLibrary | null = null;
	@state() private currentPath: string = '';

	private unsubscribeLibrary: (() => void) | null = null;

	static styles = css`
		:host {
			display: flex;
			height: 100vh;
		}
		sidebar-component {
			width: 380px;
			height: 100%;
		}
		.main-content {
			flex-grow: 1;
			display: flex;
			flex-direction: column;
			overflow: hidden;
		}
		.app-header {
			padding: 20px;
			background-color: var(--background-color);
			border-bottom: 1px solid var(--border-color);
		}
		.app-view {
			flex-grow: 1;
			overflow-y: auto;
			padding: 20px;
		}
		.header-controls {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 15px;
		}
	`;

	connectedCallback() {
		super.connectedCallback();
		this.unsubscribeLibrary = libraryStore.subscribe((library, ready) => {
			this.library = library;
			this.libraryReady = ready;
			if (this.libraryReady && this.openDocuments.length === 0) {
				this.openNewDocument();
			}
			this.requestUpdate();
		});

		this.addEventListener('path-clicked', this.handlePathClicked as EventListener);
		this.addEventListener('breadcrumb-clicked', this.handleBreadcrumbClicked as EventListener);
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		if (this.unsubscribeLibrary) {
			this.unsubscribeLibrary();
		}
		this.removeEventListener('path-clicked', this.handlePathClicked as EventListener);
		this.removeEventListener('breadcrumb-clicked', this.handleBreadcrumbClicked as EventListener);
	}

	private handlePathClicked(e: CustomEvent) {
		const clickedPath = e.detail.path;
		this.currentPath = clickedPath;
		this.requestUpdate();
	}

	private handleBreadcrumbClicked(e: CustomEvent) {
		const clickedPath = e.detail.path;
		this.currentPath = clickedPath;
		this.requestUpdate();
	}

	private openNewDocument() {
		const newDocId = this.initializeDocument();
		this.openDocuments = [...this.openDocuments, newDocId];
		this.currentPath = newDocId;
	}

	private initializeDocument(): string {
		if (!this.library) {
			console.error('Library not initialized');
			return '';
		}

		const notionModel = this.library.getDefinition('notion', 'object');

		if (!notionModel) {
			console.error('Notion definition not found');
			return '';
		}

		const rootBlock = contentStore.createBlockFromModel(notionModel);

		const theDocument: Document = {
			id: 'notionDoc' + Date.now(),
			title: 'New Notion++ Document',
			rootBlock: rootBlock.id,
		};

		contentStore.setDocument(theDocument);
		return theDocument.id;
	}

	render() {
		if (!this.libraryReady) {
			return html`<div>Loading library...</div>`;
		}

		return html`
			<sidebar-component
				.openDocuments=${this.openDocuments}
				@select-document=${this.openNewDocument}
				@create-document=${this.openNewDocument}
			></sidebar-component>
			<div class="main-content">
				<div class="app-header">
					<div class="header-controls">
						<theme-switcher></theme-switcher>
						<debug-toggle></debug-toggle>
					</div>
					<h-breadcrumbs .path=${this.currentPath}></h-breadcrumbs>
				</div>
				<div class="app-view">
					<path-renderer .path=${this.currentPath}></path-renderer>
				</div>
			</div>
		`;
	}
}