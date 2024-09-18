import { LitElement, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Content } from '../content/content';
import { Model } from '../model/model';
import { contentStore } from '../content/ContentStore';
import '../components/Breadcrumbs';

export abstract class BaseBlock extends LitElement {
	@property({ type: Object }) content: Content | undefined = undefined;
	@property({ type: Object }) model: Model | undefined = undefined;
	@property({ type: String }) path: string = '';
	@property({ type: String }) key: string = '';
	@state() protected error: string | null = null;

	constructor() {
		super();
	}

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
		// Noop
	}

	protected initPath(_path: string) {
		// Noop
	}

	protected async initModel() {
		// Noop
	}

	protected async initializeBlock() {
		// Noop
	}

	protected async updateContent(updater: (content: Content) => Content) {
		if (!this.content) {
			throw new Error('Content not found');
		}
		const content = await contentStore.update(this.content.id, updater);
		if (!content) {
			throw new Error('Failed to update content');
		}
		this.content = content;
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
			<div style="font-size:11px; margin-bottom:5px;">${this.content.id}</div>
			<div>${this.renderContent()}</div>
		`;
	}

	protected abstract renderContent(): unknown;

	protected getChildPath(childKey: string): string {
		// if first part of path is a document id (starts with DOC-), remove that part even if its the only part meaning there are no dots
		let path = this.path;
		if (path.startsWith('DOC-')) {
			const parts = path.split('.');
			if (parts.length === 1) {
				path = '';
			} else {
				path = parts.slice(1).join('.');
			}
		}

		return `${path}.${childKey}`;
	}

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
