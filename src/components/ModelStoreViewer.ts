import { LitElement, html, css, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { modelStore } from '../model/ModelStore';
import { Model } from "../model/model";
import { HierarchicalItem } from "../tree/HierarchicalItem";

@customElement('model-store-viewer')
export class ModelStoreViewer extends LitElement {
	@state() private models: Model[] = [];
	@state() private viewMode: 'flat' | 'tree' = 'flat';
	@state() private modelsHierarchy: HierarchicalItem<Model> | null = null;

	private unsubscribe: (() => void) | null = null;

	static styles = css`
		:host {
			display: block;
			font-family: Arial, sans-serif;
			font-size: 12px;
			line-height: 1.4;
		}
		.model-store-viewer {
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
		.model-item {
			border: 1px solid #ccc;
			border-radius: 4px;
			margin-bottom: 10px;
			padding: 8px;
		}
		.model-item-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			font-size: 14px;
			font-weight: bold;
			margin-bottom: 5px;
		}
		.model-type {
			color: #666;
			font-size: 12px;
		}
		.model-details {
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
			max-height: 36px;
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
			cursor: pointer;
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
	`;

	connectedCallback() {
		super.connectedCallback();
		this.unsubscribe = modelStore.subscribeAll(this.handleModelChange.bind(this));
		this.updateModels();
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		if (this.unsubscribe) {
			this.unsubscribe();
		}
	}

	private handleModelChange() {
		this.updateModels();
	}

	private async updateModels() {
		if (modelStore) {
			this.models = await modelStore.getAll();
			this.modelsHierarchy = await modelStore.getAllHierarchical();
			this.requestUpdate();
		}
	}

	render() {
		return html`
			<div class="model-store-viewer">
				<h3>Model Store</h3>
				<div class="view-buttons">
					${this.renderViewButton('flat', 'Flat')} ${this.renderViewButton('tree', 'Tree')}
				</div>
				<div>Model Count: ${this.models.length}</div>
				<div class="model-list">
					${this.viewMode === 'flat' ? this.renderFlatView() : this.renderTreeView()}
				</div>
			</div>
		`;
	}

	private renderViewButton(mode: 'flat' | 'tree', label: string) {
		return html`
			<button
				class="view-button ${this.viewMode === mode ? 'active' : ''}"
				@click=${() => this.setViewMode(mode)}
			>
				${label}
			</button>
		`;
	}

	private setViewMode(mode: 'flat' | 'tree') {
		this.viewMode = mode;
	}

	private renderFlatView(): TemplateResult {
		return html` ${this.models.map((model) => this.renderModel(model))} `;
	}

	private renderTreeView(): TemplateResult {
		if (!this.modelsHierarchy) {
			return html`<div>No hierarchy data available</div>`;
		}
		return this.renderTreeNode(this.modelsHierarchy);
	}

	private renderTreeNode(node: HierarchicalItem<Model>, level: number = 0): TemplateResult {
		const hasChildren = node.children && node.children.length > 0;
		const nodeIcon = hasChildren ? '📁' : '📄';

		return html`
			<div class="tree-node">
				<div class="tree-node-content">
					<span class="tree-node-icon">${nodeIcon}</span>
					<span class="tree-node-text" @click=${() => this.toggleNodeDetails(node.id!.toString())}>
						${node.name || node.key} (${node.type})
					</span>
				</div>
				<div class="tree-node-details" id="details-${node.id}" style="display: none;">
					${this.renderModelDetails(node)}
				</div>
				${hasChildren ? node.children.map((child) => this.renderTreeNode(child, level + 1)) : ''}
			</div>
		`;
	}

	private toggleNodeDetails(nodeId: string) {
		const detailsElement = this.shadowRoot?.getElementById(`details-${nodeId}`);
		if (detailsElement) {
			detailsElement.style.display = detailsElement.style.display === 'none' ? 'block' : 'none';
		}
	}

	private renderModel(model: Model): TemplateResult {
		return html`
			<div class="model-item">
				<div class="model-item-header">
					<span>${model.name || model.key}</span>
					<span class="model-type">${model.type}</span>
				</div>
				<div class="model-path">${model.id}</div>
				<div class="model-details">${this.renderModelDetails(model)}</div>
			</div>
		`;
	}

	private renderModelDetails(model: Model): TemplateResult {
		return html`
			<ul class="property-list">
				${Object.entries(model).map(
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
			return JSON.stringify(value);
		} else {
			return String(value);
		}
	}
}