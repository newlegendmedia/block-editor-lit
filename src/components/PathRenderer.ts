import { LitElement, html, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { until } from 'lit/directives/until.js';
import { BlockFactory } from '../blocks/BlockFactory';

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
			const pathParts = this.path.split('.');
			const documentId = pathParts[0];

			// If only document ID is provided, dispatch the document-id-only event
			if (pathParts.length === 1 && documentId.startsWith('DOC-')) {
				console.log(`Dispatching document-id-only event for document: ${documentId}`);
				this.dispatchEvent(
					new CustomEvent('document-id-only', {
						detail: { documentId },
						bubbles: true,
						composed: true,
					})
				);
				return html`<div>Loading document ${documentId}...</div>`;
			}

			// For nested paths, remove the document ID if present
			const contentPathParts = documentId.startsWith('DOC-') ? pathParts.slice(1) : pathParts;

			// The last part is the key, and everything before it is the parent path
			const key = contentPathParts[contentPathParts.length - 1];
			const parentPath = contentPathParts.slice(0, -1).join('.');

			// If parentPath is empty, it means we're at the root of the document
			const fullParentPath = parentPath ? `${documentId}.${parentPath}` : documentId;

			console.log(`Rendering component for parent path: ${fullParentPath}, key: ${key}`);

			// Use the parent path for component creation, and the last part as the key
			const component = await BlockFactory.createComponent(fullParentPath, key, 'element');

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
