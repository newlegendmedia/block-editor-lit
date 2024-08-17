import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { blockStore } from './BlockStore';
import { libraryStore, UnifiedLibrary } from '../library/libraryStore';

import './DocumentBlock';

@customElement('app-component')
export class AppComponent extends LitElement {
	@state() private documentId: string | null = null;
	@state() private library: UnifiedLibrary | null = null;

	private unsubscribeLibrary: (() => void) | null = null;

	static styles = css`
		:host {
			display: block;
			font-family: Arial, sans-serif;
		}
	`;

	connectedCallback() {
		super.connectedCallback();
		this.unsubscribeLibrary = libraryStore.subscribe((library) => {
			this.library = library;
			if (this.library) {
				this.initializeDocument();
			}
		});
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		if (this.unsubscribeLibrary) {
			this.unsubscribeLibrary();
		}
	}

	private initializeDocument() {
		if (!this.library) return;

		console.log('Initializing document...');
		console.log('Available definitions:', this.library.getAllDefinitions());

		const titleElementDef = this.library.getDefinition('titleElement', 'element');
		console.log('Title element definition:', titleElementDef);
		if (!titleElementDef) {
			console.error('Title element definition not found');
			return;
		}
		const titleBlock = blockStore.createBlockFromModel(titleElementDef, 'My First Notion++ Page');
		console.log('Created title block:', titleBlock);

		const pageDef = this.library.getDefinition('page', 'group');
		if (!pageDef) {
			console.error('Page definition not found');
			return;
		}
		const contentBlock = blockStore.createBlockFromModel(pageDef);

		const notionDef = this.library.getDefinition('notion', 'object');
		if (!notionDef) {
			console.error('Notion definition not found');
			return;
		}
		const rootBlock = blockStore.createBlockFromModel(notionDef, {
			title: titleBlock.id,
			content: contentBlock.id,
		});

		const document = {
			id: 'doc1',
			title: 'My First Document',
			rootBlock: rootBlock.id,
		};

		blockStore.setDocument(document);
		this.documentId = document.id;

		console.log('Document initialized:', document);
		console.log('Root block:', blockStore.getBlock(rootBlock.id));
	}

	render() {
		if (!this.documentId || !this.library) {
			return html`<div>Loading...</div>`;
		}

		return html`
			<h1>Notion++ Block Editor</h1>
			<document-component .documentId=${this.documentId}></document-component>
		`;
	}
}
