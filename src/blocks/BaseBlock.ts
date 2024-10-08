import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Content } from '../content/content';
import { Model } from '../model/model';
import { contentStore } from '../content/ContentStore';
//import { ContentPath } from '../content/ContentPath';
import { UniversalPath } from '../path/UniversalPath';

import '../components/Breadcrumbs';

export abstract class BaseBlock extends LitElement {
	@property({ type: Object }) content!: Content<any>;
	@property({ type: Object }) model!: Model;
	@property({ type: Object }) path!: UniversalPath;
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

	protected abstract renderContent(): unknown;

	async connectedCallback() {
		super.connectedCallback();
		await this.initializeBlock();
	}

	protected async initializeBlock() {
		// Noop
	}

	protected async updateContent(updater: (content: Content) => Content): Promise<void> {
		const updatedContent = await contentStore.update(this.content.id, updater);
		if (!updatedContent) {
			throw new Error(`Failed to update content ${this.content.id}`);
		}
		this.content = updatedContent;
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
				<div class="block-topbar">${this.renderPath()}</div>
				<div>${this.renderContent()}</div>
			</div>
		`;
	}

	protected getChildPath(childKey: string): UniversalPath {
		return new UniversalPath(this.path.toString(), childKey);
	}

	protected renderPath() {
		return html`
			<h-breadcrumbs
				.path=${this.path}
				@breadcrumb-clicked=${this.handleBreadcrumbClick}
			></h-breadcrumbs>
			<div style="font-size:11px; margin-bottom:5px;">${this.path.contentPath}</div>
		`;
	}

	private handleBreadcrumbClick(e: CustomEvent) {
		const clickedPath = new UniversalPath(e.detail.path);
		this.dispatchEvent(
			new CustomEvent('path-clicked', {
				detail: { path: clickedPath },
				bubbles: true,
				composed: true,
			})
		);
	}
}
