// ElementBlock.ts

import { html, css, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseBlock } from './BaseBlock';
import { ElementModel, AtomType, Model } from '../model/model';
import { Content } from '../content/content';

@customElement('element-block')
export class ElementBlock extends BaseBlock {
	@property({ type: Object }) inlineModel?: Model;
	@property({ type: Boolean }) isInline: boolean = false;
	@property({ type: Object }) inlineValue: any = null;

	static styles = [
		css`
			input {
				width: 100%;
				padding: 5px;
				margin: 5px 0;
				border: 1px solid var(--border-color);
				border-radius: var(--border-radius);
				background-color: var(--background-color);
				color: var(--text-color);
			}
		`,
	];

	async connectedCallback() {
		if (this.isInline) {
			// For inline elements, create a temporary content object
			this.content = this.createInlineContent();
			this.model = this.inlineModel;
		}
		await super.connectedCallback();
	}

	private createInlineContent(): Content {
		return {
			id: `inline:${this.contentId}`,
			modelInfo: {
				type: 'element',
				key: this.inlineModel?.key || 'inline-element',
			},
			content: this.inlineValue,
		};
	}

	protected async initializeContent() {
		if (this.isInline) {
			// Content is already initialized in connectedCallback for inline elements
			return;
		}
		await super.initializeContent();
	}

	protected async initializeModel() {
		if (this.isInline) {
			this.model = this.inlineModel;
		} else {
			await super.initializeModel();
		}

		if (!this.model) {
			throw new Error('Failed to initialize model');
		}
	}

	protected renderContent(): TemplateResult {
		if (!this.model || !this.content) {
			return html`<div>Error: Model or content not found</div>`;
		}

		const elementModel = this.model as ElementModel;

		return html`
			<div>
				<label>${elementModel.name || elementModel.key || 'Unnamed Element'}:</label>
				${this.renderInputElement(elementModel, this.content.content)}
			</div>
		`;
	}

	private renderInputElement(model: ElementModel, content: any): TemplateResult {
		switch (model.base) {
			case AtomType.Text:
				return this.renderTextElement(content);
			case AtomType.Number:
				return this.renderNumberElement(content);
			case AtomType.Boolean:
				return this.renderBooleanElement(content);
			case AtomType.Datetime:
				return this.renderDatetimeElement(content);
			default:
				return html`<div>Unsupported element type: ${model.base}</div>`;
		}
	}

	private renderTextElement(content: string | null): TemplateResult {
		return html`<input type="text" .value=${content ?? ''} @input=${this.handleInput} />`;
	}

	private renderNumberElement(content: number | null): TemplateResult {
		return html`<input type="number" .value=${content ?? ''} @input=${this.handleInput} />`;
	}

	private renderBooleanElement(content: boolean | null): TemplateResult {
		return html`<input type="checkbox" .checked=${content ?? false} @change=${this.handleInput} />`;
	}

	private renderDatetimeElement(content: string | null): TemplateResult {
		return html`<input type="datetime-local" .value=${content ?? ''} @input=${this.handleInput} />`;
	}

	private handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const value = target.type === 'checkbox' ? target.checked : target.value;

		if (this.isInline) {
			this.content = { ...this.content!, content: value };
			this.dispatchEvent(
				new CustomEvent('element-updated', {
					detail: { id: this.contentId, value: value },
					bubbles: true,
					composed: true,
				})
			);
		} else {
			this.updateContent((content) => ({
				...content,
				content: value,
			}));
		}
		this.requestUpdate();
	}
}
