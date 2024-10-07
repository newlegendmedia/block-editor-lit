import { LitElement, html, css, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { BlockFactory } from '../blocks/BlockFactory';
import { contentStore } from '../content/ContentStore';
import { documentManager } from '../components/DocumentManager';
import { Document, Content } from '../content/content';
import { UniversalPath } from '../path/UniversalPath';

@customElement('document-component')
export class DocumentComponent extends LitElement {
	@property({ type: String }) documentId!: string;
	@state() private document: Document | undefined = undefined;
	@state() private rootContent: Content | undefined = undefined;
	@state() private rootComponent: TemplateResult | undefined = undefined;

	static styles = css`
		:host {
			display: block;
			padding: 16px;
		}
		.error {
			color: red;
		}
	`;

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
					const path = UniversalPath.fromDocumentId(this.documentId, this.rootContent.key);
					this.rootComponent = await BlockFactory.createComponent(path, this.rootContent.type);
				} else {
					throw new Error('Root content not found');
				}
			} else {
				throw new Error('Document not found');
			}
		} catch (error) {
			console.error('Error loading document:', error);
			this.rootComponent = html`<div class="error">
				Error loading document: ${error instanceof Error ? error.message : String(error)}
			</div>`;
		}
		this.requestUpdate();
	}

	render() {
		if (!this.document || !this.rootContent) {
			return html`<div>Loading document ${this.documentId}...</div>`;
		}

		return html`
			<h1>${this.document.title}</h1>
			<div>Document ID: ${this.documentId}</div>
			<div>Root Content ID: ${this.rootContent.id}</div>
			${this.rootComponent ?? html`<div class="error">Error: Root component not loaded</div>`}
		`;
	}

	private handleBlockUpdate = async (event: CustomEvent) => {
		//		const updatedPath = new UniversalPath(event.detail.path);
		const updatedContent = event.detail.content;

		try {
			await contentStore.update(updatedContent.id, () => updatedContent);
			this.requestUpdate();
		} catch (error) {
			console.error('Error updating content:', error);
		}
	};

	connectedCallback() {
		super.connectedCallback();
		this.addEventListener('block-update', this.handleBlockUpdate as unknown as EventListener);
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this.removeEventListener('block-update', this.handleBlockUpdate as unknown as EventListener);
	}
}
