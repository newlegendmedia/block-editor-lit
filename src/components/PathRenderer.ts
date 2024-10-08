import { html, LitElement, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { until } from 'lit/directives/until.js';
import { BlockFactory } from '../blocks/BlockFactory';
import { UniversalPath } from '../path/UniversalPath';

@customElement('path-renderer')
export class PathRenderer extends LitElement {
	@property({ type: String })
	path!: string;

	render() {
		return html`
			<div>
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

		let uPath = new UniversalPath(this.path);

		try {
			// If only document ID is provided, dispatch the document-id-only event
			if (uPath.segments.length === 0) {
				this.dispatchEvent(
					new CustomEvent('document-id-only', {
						detail: { documentId: uPath.document },
						bubbles: true,
						composed: true,
					})
				);
				return html`<div>Loading document ${uPath.document}...</div>`;
			}

			const component = await BlockFactory.createComponent(uPath);

			if (!component) {
				throw new Error(`Failed to create component for path: ${uPath.toString()}`);
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
