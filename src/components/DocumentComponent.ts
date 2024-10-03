import { LitElement, html, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { BlockFactory } from '../blocks/BlockFactory';
import { contentStore } from '../content/ContentStore';
import { documentManager } from '../components/DocumentManager';
import { Document, Content } from '../content/content';
import { ContentPath } from '../content/ContentPath';

@customElement('document-component')
export class DocumentComponent extends LitElement {
	@property({ type: String }) documentId!: string;
	@state() private document: Document | undefined = undefined;
	@state() private rootContent: Content | undefined = undefined;
	@state() private rootComponent: TemplateResult | undefined = undefined;

	updated(changedProperties: Map<string, any>) {
		if (changedProperties.has('documentId')) {
			this.loadDocument();
		}
	}

	async loadDocument() {
		try {
			this.document = await documentManager.getDocument(this.documentId);
			if (this.document) {
				this.rootContent = await contentStore.get(this.document.rootContent);
				if (this.rootContent) {
					const contentPath = new ContentPath(this.documentId, this.rootContent.key);
					const modelPath = new ContentPath(this.documentId, this.rootContent.key);

					this.rootComponent = await BlockFactory.createComponent(
						contentPath.parentPath,
						contentPath.key,
						modelPath.parentPath,
						modelPath.key,
						this.rootContent.type
					);
				}
			}
		} catch (error) {
			console.error('Error loading document:', error);
		}
		this.requestUpdate();
	}

	render() {
		if (!this.document || !this.rootContent) {
			return html`<div>Loading document ${this.documentId}...</div>`;
		}

		return html`
			<h1>${this.document.title}</h1>
			<div>${this.documentId} ${this.rootContent.id}</div>
			${this.rootComponent ?? html`<div>Error: Root component not loaded</div>`}
		`;
	}
}
