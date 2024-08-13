import { html, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { ComponentFactory } from './app.ts';
import { BaseComponent } from './BaseComponent.ts';
import { isObject } from './model.ts';

// Object Component
@customElement('object-component')
export class ObjectComponent extends BaseComponent {
	override renderContent(): TemplateResult {
		if (!isObject(this.model)) {
			console.warn('Invalid model type for ObjectComponent');
			return html``;
		}
		return html`
			<div>
				<h2>${this.model.name}</h2>
				${repeat(
					this.model.properties || [],
					(prop) => prop.key!,
					(prop) => ComponentFactory.createComponent(prop, this.data?.[prop.key!])
				)}
			</div>
		`;
	}
}