import { html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import type { Model } from '../util/model';
import { ComponentFactory } from './app';
import { BaseBlock } from './BaseBlock';

@customElement('document-component')
export class DocumentBlock extends BaseBlock {
	@property({ type: Object }) documentModel!: Model;
	@property({ type: Object }) documentData: any;

	static styles = [BaseBlock.styles, css``];

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
