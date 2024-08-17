import { css, html, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { ComponentFactory } from './app';
import type { ObjectProperty } from '../util/model';
import { BaseBlock } from './BaseBlock';

@customElement('object-component')
export class ObjectBlock extends BaseBlock {
	@property({ type: Object }) override model!: ObjectProperty;
	@property({ type: Object }) data: any;

	static styles = [BaseBlock.styles, css``];

	protected override onLibraryReady() {
		super.onLibraryReady();
		// Perform any initialization that requires the library
	}

	override render(): TemplateResult {
		if (!this.libraryReady) {
			return html`<p>Loading...</p>`;
		}

		if (!this.model) {
			return html`<div class="error">Error: Invalid object configuration</div>`;
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

	protected handleValueChanged(e: CustomEvent) {
		if (!this.libraryReady) {
			console.warn('Library not ready, unable to handle value change');
			return;
		}

		const { key, value } = e.detail;
		this.data = { ...this.data, [key]: value };
		this.dispatchEvent(
			new CustomEvent('value-changed', {
				detail: { key: this.model.key, value: this.data },
				bubbles: true,
				composed: true,
			})
		);
	}
}
