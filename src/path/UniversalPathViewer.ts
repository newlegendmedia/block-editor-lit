import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { UniversalPath } from './UniversalPath'; // Import your UniversalPath class

import '../components/JsonViewer'; // Ensure the json-viewer component is imported

@customElement('universal-path-viewer')
export class UniversalPathViewer extends LitElement {
	@property({ type: Object }) path!: UniversalPath;

	constructor() {
		super();
		// Initialize with an example path
		//		this.path = UniversalPath.fromFullPath('doc123::model1:contentA.model2:contentB');
	}

	static styles = css`
		:host {
			display: block;
			padding: 16px;
			border: 1px solid #ddd;
			border-radius: 4px;
			background-color: #f9f9f9;
			max-width: 800px;
			margin: 0 auto;
		}
		h2 {
			margin-top: 0;
			color: #333;
			font-size: 1.5em;
			text-align: center;
		}
	`;

	render(): TemplateResult {
		return html`
			<h2>UniversalPath Viewer</h2>
			<json-viewer .data=${this.path}></json-viewer>
		`;
	}
}

// Ensure to declare the custom element in the global HTMLElementTagNameMap
declare global {
	interface HTMLElementTagNameMap {
		'universal-path-viewer': UniversalPathViewer;
	}
}
