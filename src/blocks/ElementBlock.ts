import { css, html, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { isElement, AtomType, ElementProperty } from '../util/model';
import { BaseBlock } from './BaseBlock';

@customElement('element-component')
export class ElementBlock extends BaseBlock {
	static styles = [BaseBlock.styles, css``];

	override renderContent(): TemplateResult {
		if (!isElement(this.model)) {
			console.warn('Invalid model type for ElementComponent');
			return html``;
		}

		const elementModel = this.model as ElementProperty;
		const isReadonly = elementModel.config?.display?.readonly === true;

		const atomType = this.model.base as AtomType;
		switch (atomType) {
			case AtomType.Text:
				return this.renderTextElement(isReadonly);
			case AtomType.Datetime:
				return this.renderDatetimeElement(isReadonly);
			case AtomType.Number:
				return this.renderNumberElement(isReadonly);
			case AtomType.Boolean:
				return this.renderBooleanElement(isReadonly);
			default:
				return html`${this.model.name}: <span>UNKNOWN ELEMENT</span><span>${this.data}</span>`;
		}
	}

	private renderTextElement(isReadonly: boolean): TemplateResult {
		return html`
			${this.model.name}:
			${isReadonly
				? html`<span>${this.data || ''}</span>`
				: html`<input type="text" .value=${this.data || ''} @input=${this.handleInput} />`}
		`;
	}

	private renderDatetimeElement(isReadonly: boolean): TemplateResult {
		return html`
			${this.model.name}:
			${isReadonly
				? html`<span>${this.data || ''}</span>`
				: html`<input
						type="datetime-local"
						.value=${this.data || ''}
						@input=${this.handleInput}
				  />`}
		`;
	}

	private renderNumberElement(isReadonly: boolean): TemplateResult {
		return html`
			${this.model.name}:
			${isReadonly
				? html`<span>${this.data || ''}</span>`
				: html`<input type="number" .value=${this.data || ''} @input=${this.handleInput} />`}
		`;
	}

	private renderBooleanElement(isReadonly: boolean): TemplateResult {
		return html`
			${this.model.name}:
			${isReadonly
				? html`<span>${this.data ? 'Yes' : 'No'}</span>`
				: html`<input
						type="checkbox"
						.checked=${this.data || false}
						@change=${this.handleInput}
				  />`}
		`;
	}

	private handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		this.data = target.type === 'checkbox' ? target.checked : target.value;
		this.dispatchEvent(
			new CustomEvent('value-changed', {
				detail: { key: this.model.key, value: this.data },
				bubbles: true,
				composed: true,
			})
		);
	}
}
