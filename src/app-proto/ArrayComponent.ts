import { html, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { ComponentFactory } from './app.ts';
import { BaseComponent } from './BaseComponent.ts';
import { isArray, isElement, isGroup, isObject, ArrayProperty, Property } from './model.ts';

// Array Component
@customElement('array-component')
export class ArrayComponent extends BaseComponent {
	@property({ type: Boolean }) repeatable: boolean = false;

	override renderContent(): TemplateResult {
		if (!isArray(this.model)) {
			console.warn('Invalid model type for ArrayComponent');
			return html``;
		}
		return html`
			<div>
				<h3>${this.model.name}</h3>
				${repeat(
					this.data || [],
					(item, index) => index,
					(item, index) => html`
						<div class="array-item">
							${ComponentFactory.createComponent((this.model as ArrayProperty).itemType, item)}
							${this.repeatable
								? html`<button @click=${() => this.removeItem(index)}>Remove</button>`
								: ''}
						</div>
					`
				)}
				${this.repeatable
					? html`<button @click=${this.addItem}>
							Add ${(this.model as ArrayProperty).itemType.name || 'Item'}
					  </button>`
					: ''}
			</div>
		`;
	}

	private addItem() {
		const newItem = this.createEmptyItem((this.model as ArrayProperty).itemType);
		this.data = [...(this.data || []), newItem];
		this.requestUpdate();
		this.dispatchEvent(
			new CustomEvent('value-changed', {
				detail: { key: this.model.key, value: this.data },
				bubbles: true,
				composed: true,
			})
		);
	}

	private removeItem(index: number) {
		this.data = this.data.filter((_, i) => i !== index);
		this.requestUpdate();
		this.dispatchEvent(
			new CustomEvent('value-changed', {
				detail: { key: this.model.key, value: this.data },
				bubbles: true,
				composed: true,
			})
		);
	}

	private createEmptyItem(itemType: Property): any {
		if (isElement(itemType)) {
			return '';
		} else if (isObject(itemType)) {
			return itemType.properties.reduce((acc, prop) => {
				acc[prop.key!] = this.createEmptyItem(prop);
				return acc;
			}, {} as Record<string, any>);
		} else if (isArray(itemType)) {
			return [];
		} else if (isGroup(itemType)) {
			return {};
		}
		return null;
	}
}