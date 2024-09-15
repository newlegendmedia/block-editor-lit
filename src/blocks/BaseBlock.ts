import { LitElement, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Content, ContentId } from '../content/content';
import { Model } from '../model/model';
import { contentStore } from '../resourcestore/';
import { modelStore } from '../modelstore/ModelStoreInstance';
import '../components/Breadcrumbs';

export abstract class BaseBlock extends LitElement {
	@property({ type: String }) contentId: ContentId = '';
	@property({ type: String }) path: string = '';
	@property({ type: String }) modelKey: string = '';
	@state() protected content?: Content;
	@state() protected model?: Model;
	@state() protected error: string | null = null;

	async connectedCallback() {
		super.connectedCallback();
		await this.initialize();
	}

	protected async initialize() {
		try {
			await this.initContent();
			this.initPath(this.path);
			await this.initModel();
			await this.initializeBlock();
		} catch (error) {
			console.error('Initialization error:', error);
			this.error = `Initialization failed: ${
				error instanceof Error ? error.message : String(error)
			}`;
		}
	}

	protected async initContent() {
		this.content = await contentStore.get(this.contentId);
	}

	protected initPath(path: string) {
		let key = this.content ? this.content.modelInfo.key : '';
		this.path = `${path}.${key}`;
	}

	protected async initModel() {
		if (!this.content) {
			throw new Error('Content not initialized');
		}

		// Remove the document ID from the start of the path
		const pathParts = this.path.split('.').slice(1);

		// For each part of the path, remove any index prefix (e.g., "0:page" becomes "page")
		const modelPath = pathParts
			.map((part) => (part.includes(':') ? part.split(':')[1] : part))
			.join('.');

		const modelType = this.content.modelInfo.type;
		this.model = await modelStore.getModel(modelPath, modelType);

		if (!this.model) {
			throw new Error(`Model not found for path: ${modelPath}`);
		}
	}

	protected async initializeBlock() {
		// This method is intentionally left empty in the base class
	}

	protected async updateContent(updater: (content: Content) => Content) {
		this.content = await contentStore.update(this.contentId, updater);
	}

	render() {
		if (this.error) {
			return html`<div class="error">${this.error}</div>`;
		}

		if (!this.content || !this.model) {
			return html`<div>Loading...</div>`;
		}
		return html`
			${this.renderPath()}
			<div style="font-size:11px; margin-bottom:5px;">${this.contentId}</div>
			<div>${this.renderContent()}</div>
		`;
	}

	protected abstract renderContent(): unknown;

	protected renderPath() {
		return html`
			<h-breadcrumbs
				.path=${this.path}
				@breadcrumb-clicked=${this.handleBreadcrumbClick}
			></h-breadcrumbs>
		`;
	}

	private handleBreadcrumbClick(e: CustomEvent) {
		const clickedPath = e.detail.path;
		this.dispatchEvent(
			new CustomEvent('path-clicked', {
				detail: { path: clickedPath },
				bubbles: true,
				composed: true,
			})
		);
	}
}
