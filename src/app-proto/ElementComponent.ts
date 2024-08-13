import { html, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { BaseComponent } from './BaseComponent.ts';
import { isElement, AtomType } from './model.ts';

// Element Component
@customElement('element-component')
export class ElementComponent extends BaseComponent {
	override renderContent(): TemplateResult {
		if (!isElement(this.model)) {
			console.warn('Invalid model type for ElementComponent');
			return html``;
		}
		const atomType = this.model.base as AtomType;
		switch (atomType) {
			case AtomType.Text:
				return html`${this.model.name}:
					<input type="text" .value=${this.data || ''} @input=${this.handleInput} />`;
			case AtomType.Datetime:
				return html`${this.model.name}:
					<input type="datetime-local" .value=${this.data || ''} @input=${this.handleInput} />`;
			case AtomType.Number:
				return html`${this.model.name}:
					<input type="number" .value=${this.data || ''} @input=${this.handleInput} />`;
			case AtomType.Boolean:
				return html`${this.model.name}:
					<input type="checkbox" .checked=${this.data || false} @change=${this.handleInput} />`;
			default:
				return html`${this.model.name}: <span>UNKNOWN ELEMENT</span><span>${this.data}</span>`;
		}
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
