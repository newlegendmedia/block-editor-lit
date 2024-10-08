import { html, LitElement, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { until } from 'lit/directives/until.js';
import { BlockFactory } from '../blocks/BlockFactory';
import { UniversalPath } from '../path/UniversalPath';

@customElement('path-renderer')
export class PathRenderer extends LitElement {
	@property({ type: String })
	path!: string;

	private uPath: UniversalPath | undefined;

	render() {
		if (!this.uPath) {
			return html`<div>No path specified</div>`;
		}
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
		if (!this.uPath) {
			return html`<div>No path specified</div>`;
		}
		if (this.uPath.segments.length === 0) {
			return html`<div>No path specified</div>`;
		}

		try {
			// If only document ID is provided, dispatch the document-id-only event
			if (this.uPath.segments.length === 1) {
				this.dispatchEvent(
					new CustomEvent('document-id-only', {
						detail: { documentId: this.uPath.document },
						bubbles: true,
						composed: true,
					})
				);
				return html`<div>Loading document ${this.uPath.document}...</div>`;
			}

			const component = await BlockFactory.createComponent(this.uPath);

			if (!component) {
				throw new Error(`Failed to create component for path: ${this.uPath.toString()}`);
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

	private handleBlockUpdate = (event: CustomEvent) => {
		const updatedPath = event.detail.path as UniversalPath;
		const updatedContent = event.detail.content;

		// Dispatch an event to notify parent components of the update
		this.dispatchEvent(
			new CustomEvent('content-updated', {
				detail: { path: updatedPath, content: updatedContent },
				bubbles: true,
				composed: true,
			})
		);

		// Trigger a re-render of this component
		this.requestUpdate();
	};

	connectedCallback() {
		super.connectedCallback();
		this.addEventListener('block-update', this.handleBlockUpdate as EventListener);
		this.uPath = new UniversalPath(this.path);
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this.removeEventListener('block-update', this.handleBlockUpdate as EventListener);
	}
}
