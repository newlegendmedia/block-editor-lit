import { html, css, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { BaseBlock } from './BaseBlock';
import { ElementProperty, AtomType, isElement } from '../util/model';

@customElement('element-component')
export class ElementBlock extends BaseBlock {
	static styles = [
		BaseBlock.styles,
		css`
			input {
				width: 100%;
				padding: 5px;
				margin: 5px 0;
				border: 1px solid var(--border-color);
				border-radius: var(--border-radius);
			}
		`,
	];

	protected renderContent(): TemplateResult {
		if (!this.block || !this.library) {
			return html`<div>Loading...</div>`;
		}

		const model = this.getModel();
		if (!model || !isElement(model)) {
			return html`<div>Invalid model ${model}</div>`;
		}

		const elementModel = model as ElementProperty;
		const content = this.block.content;
		const isReadonly = false; // elementModel.config?.display?.readonly === true;

		return html`
			<div>
				<label>${elementModel.name || elementModel.key}:</label>
				${this.renderInputElement(elementModel, content, isReadonly)}
			</div>
		`;
	}

	private renderInputElement(
		model: ElementProperty,
		content: any,
		isReadonly: boolean
	): TemplateResult {
		switch (model.base) {
			case AtomType.Text:
				return this.renderTextElement(content, isReadonly);
			case AtomType.Number:
				return this.renderNumberElement(content, isReadonly);
			case AtomType.Boolean:
				return this.renderBooleanElement(content, isReadonly);
			case AtomType.Datetime:
				return this.renderDatetimeElement(content, isReadonly);
			default:
				return html`<div>Unsupported element type: ${model.base}</div>`;
		}
	}

	private renderTextElement(content: string, isReadonly: boolean): TemplateResult {
		return html`
			${isReadonly
				? html`<span>${content || ''}</span>`
				: html`<input type="text" .value=${content || ''} @input=${this.handleInput} />`}
		`;
	}

	private renderNumberElement(content: number, isReadonly: boolean): TemplateResult {
		return html`
			${isReadonly
				? html`<span>${content || ''}</span>`
				: html`<input type="number" .value=${content || ''} @input=${this.handleInput} />`}
		`;
	}

	private renderBooleanElement(content: boolean, isReadonly: boolean): TemplateResult {
		return html`
			${isReadonly
				? html`<span>${content ? 'Yes' : 'No'}</span>`
				: html`<input type="checkbox" .checked=${content || false} @change=${this.handleInput} />`}
		`;
	}

	private renderDatetimeElement(content: string, isReadonly: boolean): TemplateResult {
		return html`
			${isReadonly
				? html`<span>${content || ''}</span>`
				: html`<input type="datetime-local" .value=${content || ''} @input=${this.handleInput} />`}
		`;
	}

	private handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const value = target.type === 'checkbox' ? target.checked : target.value;
		this.updateBlockContent(value);
	}
}
