import { LitElement, html, TemplateResult } from 'lit-element';
import { customElement, property } from 'lit/decorators.js';
import { until } from 'lit/directives/until.js';
import { BlockFactory } from '../../blocks/BlockFactory';
import { ContentPath } from '../../content/ContentPath';

@customElement('path-renderer')
export class PathRenderer extends LitElement {
	@property({ type: Object }) contentPath!: ContentPath;
	@property({ type: Object }) modelPath!: ContentPath;

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
		try {
			return await BlockFactory.createComponent(
				this.contentPath.toString(),
				this.contentPath.key,
				this.modelPath.toString(),
				this.modelPath.key
			);
		} catch (error) {
			console.error('Error in PathRenderer:', error);
			return html`<div>Error: ${error instanceof Error ? error.message : String(error)}</div>`;
		}
	}
}
