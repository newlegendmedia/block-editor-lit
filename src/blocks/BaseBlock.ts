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
	@state() protected content?: Content;
	@state() protected model?: Model;
	@state() protected error: string | null = null;

	async connectedCallback() {
		super.connectedCallback();
		await this.initialize();
		await this.initializeBlock();
	}

	protected async initialize() {
		await this.initContent();
		await this.initModel();
		//		this.initPath(this.path);
	}

	protected async initContent() {
		console.log('BaseBlock.initContent getting ', this.contentId);
		this.content = await contentStore.get(this.contentId);
		console.log('BaseBlock.initContent', this.contentId, this.content);
	}

	protected async initModel() {
		this.model = this.content?.modelDefinition || undefined;
		this.initPath(this.path);
		// remove the doc id from the start of the path
		const path = this.path.split('.').slice(1).join('.');
		const m = await modelStore.get(path);
		console.log('BaseBlock.initModel', this.path, m);
	}

	protected initPath(path: string) {
		console.log('BaseBlock.initPath', path);
		this.path = `${path}.${this.model?.key}`;
	}

	protected async initializeBlock() {
		console.log('BaseBlock.initializeBlock complete');
		// This method is intentionally left empty in the base class
	}

	protected async updateContent(updater: (content: Content) => Content) {
		this.content = await contentStore.update(this.contentId, updater);
	}

	protected render() {
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
