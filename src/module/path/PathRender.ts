import { LitElement, html, TemplateResult } from 'lit-element';
import { customElement, property } from 'lit/decorators.js';
import { until } from 'lit/directives/until.js';

@customElement('path-renderer')
class PathRender extends LitElement {
	@property({ type: Object }) path!: AdaptedUniversalPath;

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
			return await BlockFactoryAdapter.createComponent(this.path);
		} catch (error) {
			console.error('Error in PathRenderer:', error);
			return html`<div>Error: ${error instanceof Error ? error.message : String(error)}</div>`;
		}
	}
}
