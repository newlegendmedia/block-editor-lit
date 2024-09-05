import { LitElement, html, css, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { contentStore } from '../resourcestore';
import { Content, Document, isCompositeContent } from '../content/content';
import { HierarchicalItem } from '../tree/HierarchicalItem';

@customElement('content-store-viewer')
export class ContentStoreViewer extends LitElement {
	@state() private contents: Content[] = [];
	@state() private documents: Document[] = [];
	@state() private viewMode: 'flat' | 'hierarchical' = 'flat';
	@state() private contentsHierarchy: HierarchicalItem<Content> | null = null;

	private unsubscribe: (() => void) | null = null;

	static styles = css`
		:host {
			display: block;
			font-family: Arial, sans-serif;
			font-size: 12px;
			line-height: 1.4;
		}
		.content-store-viewer {
			padding: 10px;
		}
		.content-item {
			border: 1px solid #ccc;
			border-radius: 4px;
			margin-bottom: 10px;
			padding: 8px;
		}
		.content-id {
			font-weight: bold;
			margin-bottom: 4px;
		}
		.content-type {
			color: #666;
			margin-bottom: 4px;
		}
		.content-details {
			margin-top: 4px;
		}
		.property-list {
			list-style-type: none;
			padding: 0;
			margin: 0;
		}
		.property-item {
			display: flex;
			justify-content: space-between;
			border-bottom: 1px solid #eee;
			padding: 2px 0;
		}
		.property-key {
			font-weight: bold;
			margin-right: 8px;
		}
		.property-value {
			word-break: break-all;
			max-width: 60%;
			text-align: right;
		}
		.hierarchical-view {
			margin-left: 20px;
		}
		.toggle-button {
			margin-bottom: 10px;
		}
	`;

	async connectedCallback() {
		super.connectedCallback();
		this.unsubscribe = contentStore.subscribeAll(this.handleContentChange.bind(this));
		await this.updateContents();
		await this.updateDocuments();
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		if (this.unsubscribe) {
			this.unsubscribe();
		}
	}

	private handleContentChange() {
		this.updateContents();
	}

	private async updateDocuments() {
		this.requestUpdate();
	}

	// render() {
	// 	return html`
	// 		<div class="content-store-viewer">
	// 			<h3>Content Store</h3>
	// 			<div>Content Count: ${this.contents.length}</div>
	// 			<div>Document Count: ${this.documents.length}</div>
	// 			<h4>Documents</h4>
	// 			<div class="document-list">${this.documents.map((doc) => this.renderDocument(doc))}</div>
	// 			<h4>Contents</h4>
	// 			<div class="content-list">
	// 				${this.contents.map((content) => this.renderContent(content))}
	// 			</div>
	// 		</div>
	// 	`;
	// }

	private toggleViewMode() {
		this.viewMode = this.viewMode === 'flat' ? 'hierarchical' : 'flat';
	}

	private async updateContents() {
		this.contents = await contentStore.getAll();
		this.contentsHierarchy = null;
		this.contentsHierarchy = await contentStore.getAllHierarchical();
		;
		this.requestUpdate();
	}

	render() {
		return html`
			<div class="content-store-viewer">
				<h3>Content Store</h3>
				<button @click=${this.toggleViewMode}>
					Switch to ${this.viewMode === 'flat' ? 'Hierarchical' : 'Flat'} View
				</button>
				<div>Content Count: ${this.contents.length}</div>
				<div>Document Count: ${this.documents.length}</div>
				<h4>Documents</h4>
				<div class="document-list">${this.documents.map((doc) => this.renderDocument(doc))}</div>
				<h4>Contents</h4>
				<div class="content-list">
					${this.viewMode === 'flat'
						? this.contents.map((content) => this.renderContent(content))
						: this.renderHierarchicalContents(this.contentsHierarchy)}
				</div>
			</div>
		`;
	}

	private renderHierarchicalContents(
		hierarchicalItem: HierarchicalItem<Content> | null,
		level: number = 0
	): TemplateResult {
		if (!hierarchicalItem) return html``;

		return html`
			<div style="margin-left: ${level * 20}px;">
				${this.renderContent(hierarchicalItem)}
				${hierarchicalItem.children.map((child) =>
					this.renderHierarchicalContents(child, level + 1)
				)}
			</div>
		`;
	}

	private renderDocument(doc: Document) {
		return html`
			<div class="document-item">
				<div class="document-id">${doc.id}</div>
				<div>Title: ${doc.title}</div>
				<div>Root Content: ${doc.rootContent}</div>
				<div>Created: ${doc.createdAt}</div>
				<div>Updated: ${doc.updatedAt}</div>
			</div>
		`;
	}

	private renderContent(content: Content) {
		return html`
			<div class="content-item">
				<div class="content-id">${content.id}</div>
				<div class="content-type">${content.modelInfo.type} | ${content.modelInfo.key}</div>
				${content.modelInfo.ref ? html`<div>Model Ref: ${content.modelInfo.ref}</div>` : ''}
				<div class="content-details">${this.renderContentDetails(content)}</div>
			</div>
		`;
	}

	private renderContentDetails(content: Content) {
		// check if content is an empty object
		if (
			content.content &&
			typeof content.content === 'object' &&
			Object.keys(content.content).length === 0
		) {
			return html`<div class="simple-content">Empty Content</div>`;
		}
		if (isCompositeContent(content)) {
			return this.renderCompositeContent(content.content);
		} else {
			return this.renderSimpleContent(content.content);
		}
	}

	private renderCompositeContent(content: any) {
		if (typeof content === 'string') {
			try {
				const parsedContent = JSON.parse(content);
				return this.renderParsedContent(parsedContent);
			} catch (error) {
				//        return html`<div class="error">Error parsing JSON: ${error.message}</div>`;
			}
		} else if (typeof content === 'object' && content !== null) {
			return this.renderParsedContent(content);
		} else {
			return html`<div class="simple-content">${String(content)}</div>`;
		}
	}

	private renderSimpleContent(content: any) {
		return html`<div class="simple-content">${String(content)}</div>`;
	}

	private renderParsedContent(content: any) {
		return html`
			<ul class="property-list">
				${Object.entries(content).map(
					([key, value]) => html`
						<li class="property-item">
							<span class="property-key">${key}:</span>
							<span class="property-value">${this.renderValue(value)}</span>
						</li>
					`
				)}
			</ul>
		`;
	}

	private renderValue(value: any) {
		if (typeof value === 'object' && value !== null) {
			return JSON.stringify(value);
		} else {
			return String(value);
		}
	}
}
