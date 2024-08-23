import { html, css, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { CompositeBlock } from './CompositeBlock';
import { ComponentFactory } from '../util/ComponentFactory';
import { ObjectModel } from '../model/model';

@customElement('object-block')
export class ObjectBlock extends CompositeBlock<'keyed'> {
	static styles = [
		CompositeBlock.styles,
		css`
			.object-content {
				display: flex;
				flex-direction: column;
				gap: var(--spacing-small);
			}
		`,
	];

	renderContent(): TemplateResult {
		if (!this.content || !this.library || !this.model) {
			return html`<div>Object Loading...</div>`;
		}

		const objectModel = this.model as ObjectModel;

		return html`
			<div>
				<h2>${objectModel.name || 'Object'}</h2>
				<div class="object-content">
					${repeat(
						objectModel.properties,
						(prop) => prop.key!,
						(prop) => this.renderProp(prop.key!)
					)}
				</div>
			</div>
		`;
	}

	private renderProp(key: string): TemplateResult {
		const childContentId = this.childBlocks[key];
		if (!childContentId) {
			return html`<div>Error: Child block not found for ${key}</div>`;
		}
		const childPath = `${this.path}.${key}`;
		return ComponentFactory.createComponent(childContentId, this.library!, childPath);
	}
}
