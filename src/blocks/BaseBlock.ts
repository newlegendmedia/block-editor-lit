import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Content } from '../content/content';
import { Model } from '../model/model';
import { contentStore } from '../content/ContentStore';
import { ContentPath } from '../content/ContentPath';
import '../components/Breadcrumbs';

export abstract class BaseBlock extends LitElement {
	@property({ type: Object }) content!: Content<any>;
	@property({ type: Object }) model!: Model;
	@property({ type: Object }) contentPath!: ContentPath;
	@property({ type: Object }) modelPath!: ContentPath;
	@state() protected error: string | null = null;

	static blockStyles = css`
		:host {
			box-sizing: border-box;
		}
		*,
		*::before,
		*::after {
			box-sizing: inherit;
		}
		button {
			appearance: none;
			background-color: var(--button-alt-bg-color);
			border: none;
			border-radius: var(--border-radius);
			color: var(--button-alt-text-color);
			padding: var(--spacing-xsmall) var(--spacing-small);
		}
		button:hover {
			background-color: var(--button-alt-hover-bg-color);
		}
		.block-topbar {
			padding: var(--spacing-xsmall) 0;
			display: flex;
			flex-direction: row;
			justify-content: space-between;
		}
	`;

	async connectedCallback() {
		super.connectedCallback();
		await this.initialize();
	}

	protected async initialize() {
		try {
			await this.initializeBlock();
		} catch (error) {
			console.error('Initialization error:', error);
			this.error = `Initialization failed: ${
				error instanceof Error ? error.message : String(error)
			}`;
		}
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
			//			throw new Error('Failed to update content');
			console.warn('Failed to update content', this.content.id);
			return;
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
			<div class="block">
				<div class="block-topbar">
					${this.renderPath()}
					<div style="font-size:11px; margin-bottom:5px;">${this.content.id}</div>
				</div>
				<div>${this.renderContent()}</div>
			</div>
		`;
	}

	protected abstract renderContent(): unknown;

	protected getChildPath(childKey: string): string {
		if (!this.contentPath) {
			throw new Error('Content path not initialized');
		}
		return new ContentPath(this.contentPath.toString(), childKey).toString();
	}

	protected renderPath() {
		return html`
			<h-breadcrumbs
				.path=${this.modelPath}
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
