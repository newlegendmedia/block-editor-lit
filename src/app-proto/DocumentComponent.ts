import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Model } from './model';
import { ComponentFactory } from './app';

// Document Component
@customElement('document-component')
export class DocumentComponent extends LitElement {
	@property({ type: Object }) documentModel!: Model;
	@property({ type: Object }) documentData: any = {};

	static styles = css`
		:host {
			display: block;
			font-family: Arial, sans-serif;
			max-width: 800px;
			margin: 0 auto;
			padding: 20px;
		}
	`;

	constructor() {
		super();
		this.addEventListener('value-changed', this.handleValueChanged as EventListener);
	}

	render() {
		return html`
			${ComponentFactory.createComponent(this.documentModel, this.documentData)}
			<button @click=${this.saveDocument}>Save Document</button>
		`;
	}

	handleValueChanged(e: CustomEvent) {
		const { key, value } = e.detail;
		this.documentData = { ...this.documentData, [key]: value };
		this.requestUpdate();
	}

	saveDocument() {
		console.log('Saving document:', this.documentData);
		// Implement actual save functionality here
	}
}