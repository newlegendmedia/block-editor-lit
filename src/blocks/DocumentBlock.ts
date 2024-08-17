import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ComponentFactory } from '../util/ComponentFactory';
import { blockStore, Document as DocumentType } from './BlockStore';
import { libraryStore, UnifiedLibrary } from '../library/libraryStore';

@customElement('document-component')
export class DocumentComponent extends LitElement {
	@property({ type: String }) documentId!: string;
	@state() private document: DocumentType | null = null;
	@state() private library: UnifiedLibrary | null = null;

	private unsubscribeLibrary: (() => void) | null = null;

	static styles = css`
		:host {
			display: block;
			padding: 16px;
		}
	`;

	connectedCallback() {
		super.connectedCallback();
		this.unsubscribeLibrary = libraryStore.subscribe((library) => {
			this.library = library;
			this.requestUpdate();
		});
		this.loadDocument();
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		if (this.unsubscribeLibrary) {
			this.unsubscribeLibrary();
		}
	}

	updated(changedProperties: Map<string, any>) {
		if (changedProperties.has('documentId')) {
			this.loadDocument();
		}
	}

	private loadDocument() {
		console.log('Loading document with id:', this.documentId);
		const doc = blockStore.getDocument(this.documentId);
		if (doc) {
			this.document = doc;
			console.log('Document loaded:', this.document);
		} else {
			this.document = null;
			console.error(`Document with id ${this.documentId} not found`);
		}
		this.requestUpdate();
	}

	render() {
		console.log('Document render, document:', this.document);
		if (!this.document || !this.library) {
			return html`<div>Loading document...</div>`;
		}

		return html`
			<h1>${this.document.title}</h1>
			${ComponentFactory.createComponent(this.document.rootBlock, this.library)}
		`;
	}
}
