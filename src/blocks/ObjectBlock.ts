import { html, css, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { CompositeBlock } from './CompositeBlock';
import { ComponentFactory } from '../util/ComponentFactory';
import { isElement, isObject, Model } from '../model/model';
//import { contentStore } from '../content/ContentStore';

// Define the custom event interface
interface ElementUpdatedEvent extends CustomEvent {
	detail: {
		id: string;
		value: any;
	};
}

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

	connectedCallback() {
		super.connectedCallback();
		if (this.inlineChildren) {
			this.addEventListener('element-updated', this.handleInlineElementUpdate as EventListener);
		}
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		if (this.inlineChildren) {
			this.removeEventListener('element-updated', this.handleInlineElementUpdate as EventListener);
		}
	}

	renderContent(): TemplateResult {
		if (!this.content || !this.library || !this.model || !isObject(this.model)) {
			return html`<div>Object Loading...</div>`;
		}

		return html`
			<div>
				<h2>${this.model.name || 'Object'}</h2>
				<div class="object-content">
					${repeat(
			this.model.properties,
			(prop) => prop.key!,
			(prop) => this.renderChild(prop)
		)}
				</div>
			</div>
		`;
	}

	private renderChild(property: Model): TemplateResult {
		if (!property.key || !this.model || !isObject(this.model)) {
			return html`<div>Invalid property</div>`;
		}

		const childKey = property.key;
		const childPath = `${this.path}.${childKey}`;

		if (this.inlineChildren && isElement(property)) {
			return ComponentFactory.createComponent(
				`inline:${this.contentId}:${childKey}`,
				this.library!,
				childPath,
				property
			);
		}

		const childContentId = this.getChildBlockId(childKey);
		return ComponentFactory.createComponent(childContentId!, this.library!, childPath);
	}

	private handleInlineElementUpdate(event: ElementUpdatedEvent) {
		const { id, value } = event.detail;
		if (id.startsWith('inline:')) {
			const [, parentId, childKey] = id.split(':');
			if (parentId === this.contentId && this.content && this.content.content) {
				const updatedContent = {
					...(this.content.content as Record<string, unknown>),
					[childKey]: value,
				};
				this.updateBlockContent(updatedContent);
			}
		}
	}
}
