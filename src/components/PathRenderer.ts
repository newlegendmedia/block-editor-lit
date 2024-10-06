import { LitElement, html, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { until } from 'lit/directives/until.js';
import { BlockFactory } from '../blocks/BlockFactory';
import { ContentPath } from '../content/ContentPath';

@customElement('path-renderer')
export class PathRenderer extends LitElement {
	@property({ type: String })
	path: string = '';

	render() {
		return html`
			<div>
				<p>PathRenderer is active. Current path: ${this.path}</p>
				${until(
					this.renderTargetContent(),
					html`<div>Loading content...</div>`,
					html`<div>Error loading content</div>`
				)}
			</div>
		`;
	}

	private async renderTargetContent(): Promise<TemplateResult> {
		if (!this.path) {
			return html`<div>No path specified</div>`;
		}

		try {
			const contentPath = new ContentPath(this.path);

			// If only document ID is provided, dispatch the document-id-only event
			if (contentPath.pathSegments.length === 1) {
				this.dispatchEvent(
					new CustomEvent('document-id-only', {
						detail: { documentId: contentPath.document },
						bubbles: true,
						composed: true,
					})
				);
				return html`<div>Loading document ${contentPath.document}...</div>`;
			}

			const key = contentPath.key;
			const parentPath = contentPath.parentPath.toString();

			const component = await BlockFactory.createComponent(parentPath, key, parentPath, key);

			if (!component) {
				throw new Error(`Failed to create component for path: ${this.path}`);
			}

			return component;
		} catch (error) {
			console.error('Error in PathRenderer:', error);
			this.dispatchEvent(
				new CustomEvent('render-error', {
					detail: { error: error instanceof Error ? error.message : String(error) },
					bubbles: true,
					composed: true,
				})
			);
			return html`<div>Error: ${error instanceof Error ? error.message : String(error)}</div>`;
		}
	}
}
