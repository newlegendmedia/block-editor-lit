import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { contentStore } from '../content/ContentStore';
import { Content, ContentReference } from '../content/content';
import { HierarchicalItem } from '../tree/HierarchicalItem';

@customElement('content-store-viewer')
export class ContentStoreViewer extends LitElement {
	@state() private contents: Content[] = [];
	@state() private viewMode: 'flat' | 'hierarchical' | 'tree' = 'tree';
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
		.view-buttons {
			display: flex;
			gap: 10px;
			margin-bottom: 10px;
		}
		.view-button {
			padding: 5px 10px;
			border: 1px solid #ccc;
			background-color: #f0f0f0;
			cursor: pointer;
			border-radius: 3px;
		}
		.view-button.active {
			background-color: #007bff;
			color: white;
		}
		.content-list ul {
			padding-left: 0;
		}
		.content-item {
			border: 1px solid #ccc;
			border-radius: 4px;
			margin-bottom: 10px;
			padding: 8px;
		}
		.content-item-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			font-size: 14px;
			font-weight: bold;
			margin-bottom: 5px;
		}
		.content-type {
			color: #666;
			font-size: 12px;
		}
		.content-details {
			margin-top: 5px;
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
			max-height: 45px;
			overflow-y: auto;
		}
		.tree-view {
			font-family: monospace;
		}
		.tree-node {
			padding-left: 20px;
		}
		.tree-node-content {
			display: flex;
			align-items: center;
		}
		.tree-node-icon {
			margin-right: 5px;
		}
		.tree-node-text {
			cursor: pointer;
		}
		.tree-node-text:hover {
			text-decoration: underline;
		}
		.tree-node-details {
			margin-left: 20px;
			font-size: 11px;
			color: #666;
		}
		.level-wrap {
			margin-left: 10px;
		}
	`;

	connectedCallback() {
		super.connectedCallback();
		this.unsubscribe = contentStore.subscribeAll(this.handleContentChange.bind(this));
		this.updateContents();
	}

	disconnectedCallback() {
		super.disconnectedCallback();

		if (this.unsubscribe) {
			this.unsubscribe();
		}
	}

	private handleContentChange() {
		console.log('Content store changed');
		this.updateContents();
	}

	private async updateContents() {
		if (contentStore) {
			this.contents = await contentStore.getAll();
			this.contentsHierarchy = await contentStore.getAllHierarchical();
			this.requestUpdate();
		}
	}

	render() {
		return html`
			<div class="content-store-viewer">
				<h3>Content Store</h3>
				<div class="view-buttons">
					${this.renderViewButton('flat', 'Flat')}
					${this.renderViewButton('hierarchical', 'Hierarchy')}
					${this.renderViewButton('tree', 'Tree')}
				</div>
				<div>Content Count: ${this.contents.length}</div>
				<div class="content-list">${this.renderCurrentView()}</div>
			</div>
		`;
	}

	private renderViewButton(mode: 'flat' | 'hierarchical' | 'tree', label: string) {
		return html`
			<button
				class="view-button ${this.viewMode === mode ? 'active' : ''}"
				@click=${() => this.setViewMode(mode)}
			>
				${label}
			</button>
		`;
	}

	private setViewMode(mode: 'flat' | 'hierarchical' | 'tree') {
		this.viewMode = mode;
	}

	private renderCurrentView(): TemplateResult {
		switch (this.viewMode) {
			case 'flat':
				return this.renderFlatView();
			case 'hierarchical':
				return this.renderHierarchicalView();
			case 'tree':
				return this.renderTreeView();
			default:
				return html`<div>Invalid view mode</div>`;
		}
	}

	private renderFlatView(): TemplateResult {
		return html` ${this.contents.map((content) => this.renderContent(content))} `;
	}

	private renderHierarchicalView(): TemplateResult {
		return html`
			<ul>
				${this.renderHierarchicalContents(this.contentsHierarchy)}
			</ul>
		`;
	}

	private renderHierarchicalContents(
		hierarchicalItem: HierarchicalItem<Content> | null,
		level: number = 0
	): TemplateResult {
		if (!hierarchicalItem) return html``;

		return html`
			<div class="level-wrap">
				${this.renderContent(hierarchicalItem as Content)}
				${hierarchicalItem.children
					? html`
							<div style="margin-left: 20px;">
								${(hierarchicalItem.children as HierarchicalItem<Content>[]).map((child) => {
									return this.renderHierarchicalContents(child, level + 1);
								})}
							</div>
						`
					: ''}
			</div>
		`;
	}

	private renderHierarchicalContent(contents: Content[]): TemplateResult {
		return html`
			${contents.map(
				(content) => html`
					<li>
						${content.key} (${content.type})
						${Array.isArray(content.content)
							? html`<ul>
									${this.renderHierarchicalContent(content.content)}
								</ul>`
							: ''}
					</li>
				`
			)}
		`;
	}

	private renderTreeView(): TemplateResult {
		if (!this.contentsHierarchy) {
			return html`<div>No hierarchy data available</div>`;
		}
		return this.renderTreeNode(this.contentsHierarchy as HierarchicalItem<Content>);
	}

	private renderTreeNode(node: HierarchicalItem<Content> | ContentReference): TemplateResult {
		const isContentReference = false; //'type' in node && !('modelInfo' in node);
		const nodeId = isContentReference ? node.id : (node as HierarchicalItem<Content>).id;
		const nodeType = isContentReference ? node.type : (node as Content).type;
		const nodeKey = isContentReference ? node.key : (node as Content).key;
		const hasChildren =
			!isContentReference && 'children' in node && node.children && node.children.length > 0;
		const nodeIcon = hasChildren ? '📁' : '📄';

		return html`
			<div class="tree-node">
				<div class="tree-node-content">
					<span class="tree-node-icon">${nodeIcon}</span>
					<span class="tree-node-text" @click=${() => this.toggleNodeDetails(nodeId)}>
						(${nodeKey} | ${nodeType})
					</span>
				</div>
				<div class="tree-node-details" id="details-${nodeId}" style="display: none;">
					${isContentReference
						? this.renderContentReferenceDetails(node)
						: this.renderContentDetails(node as Content)}
				</div>
				${hasChildren
					? (node as HierarchicalItem<Content>).children.map((child) => {
							return this.renderTreeNode(child as HierarchicalItem<Content>);
						})
					: ''}
			</div>
		`;
	}

	private renderContentReferenceDetails(contentRef: ContentReference): TemplateResult {
		return html`
			<ul class="property-list">
				<li class="property-item">
					<span class="property-key">XXid:</span>
					<span class="property-value">${contentRef.id}</span>
				</li>
				<li class="property-item">
					<span class="property-key">key:</span>
					<span class="property-value">${contentRef.key}</span>
				</li>
				<li class="property-item">
					<span class="property-key">type:</span>
					<span class="property-value">${contentRef.type}</span>
				</li>
			</ul>
		`;
	}

	private renderContent(content: Content): TemplateResult {
		return html`
			<div class="content-item">
				<div class="content-item-header">
					<span>${content.key}</span>
					<span class="content-type">${content.type}</span>
				</div>
				<div class="content-id">${content.id}</div>
				<div class="content-details">${this.renderContentDetails(content)}</div>
			</div>
		`;
	}

	private renderContentDetails(content: Content): TemplateResult {
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

	private renderValue(value: any): string {
		if (typeof value === 'object' && value !== null) {
			if (Array.isArray(value)) {
				// Handle arrays (like children array of ContentReferences)
				return JSON.stringify(
					value.map((item) => {
						if (typeof item === 'object' && 'id' in item && 'key' in item && 'type' in item) {
							// This is likely a ContentReference
							return `{id: ${item.id}, key: ${item.key}, type: ${item.type}}`;
						}
						return JSON.stringify(item);
					})
				);
			} else {
				return JSON.stringify(value);
			}
		} else {
			return String(value);
		}
	}

	private toggleNodeDetails(nodeId: string) {
		const detailsElement = this.shadowRoot?.getElementById(`details-${nodeId}`);

		if (detailsElement) {
			detailsElement.style.display = detailsElement.style.display === 'none' ? 'block' : 'none';
		}
	}
}
