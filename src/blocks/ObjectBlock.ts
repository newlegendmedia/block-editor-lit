import { html, css, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { until } from 'lit/directives/until.js';
import { KeyedCompositeBlock } from './KeyedCompositeBlock';
import { ComponentFactory } from '../util/ComponentFactory';
import { ObjectModel, Model, isElement } from '../model/model';
import { KeyedCompositeContent } from '../content/content';

@customElement('object-block')
export class ObjectBlock extends KeyedCompositeBlock {
	//  @property({ type: Object }) inlineValue: any = null;
	@state() private childComponentPromises: Record<string, Promise<TemplateResult>> = {};

	constructor() {
		super();
	}

	static styles = [
		css`
			.object-content {
				display: flex;
				flex-direction: column;
				gap: var(--spacing-small);
			}
			.property-item {
				display: flex;
				align-items: flex-start;
				gap: var(--spacing-small);
			}
			.property-label {
				font-weight: bold;
				min-width: 120px;
			}
		`,
	];

	async connectedCallback() {
		;
		await super.connectedCallback();
		this.addEventListener('element-updated', this.handleElementUpdate as EventListener);
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this.removeEventListener('element-updated', this.handleElementUpdate as EventListener);
	}
	
	protected async initializeBlock() {
		await super.initializeBlock();
		this.inlineChildren = this.useInlineChildren();
		await this.initializeChildComponents();
	}
	
	protected getModelProperties(): Model[] {
		return (this.model as ObjectModel)?.properties || [];
	}

	protected getDefaultValue(prop: Model): any {
		if (isElement(prop)) {
			switch (prop.base) {
				case 'boolean':
					return false;
				case 'number':
					return 0;
				case 'datetime':
					return new Date().toISOString();
				case 'text':
					return 'Hello World 2';
				default:
					return '???';
			}
		}
		return '?';
	}

	protected useInlineChildren(): boolean {
		return (this.model as ObjectModel)?.inlineChildren || false;
	}

	private async initializeChildComponents() {
		;
		const componentPromises: Record<string, Promise<TemplateResult>> = {};
		for (const prop of this.getModelProperties()) {
			if (prop.key) {
				componentPromises[prop.key] = this.createChildComponent(prop);
			}
		}
		this.childComponentPromises = componentPromises;
		this.requestUpdate();
	}

	private async createChildComponent(property: Model): Promise<TemplateResult> {
		const childKey = property.key!;
		const childPath = this.getChildPath(childKey);
	
		if (this.inlineChildren && isElement(property)) {
		  return this.createInlineChildComponent(property, childKey, childPath);
		} else {
		  return this.createStandardChildComponent(property, childKey, childPath);
		}
	  }
	
	  private createInlineChildComponent(property: Model, childKey: string, childPath: string) {
		let value = (this.content?.content as KeyedCompositeContent)?.[childKey];
		console.log('ObjectBlock: createComponent inline key, path', childKey, childPath);
		return ComponentFactory.createComponent(
		  `inline:${this.contentId}:${childKey}`,
		  childPath,
		  property,
		  value
		);
	  }
		
	  private createStandardChildComponent(_property: Model, childKey: string, childPath: string) {
		const childContentId = (this.content?.content as KeyedCompositeContent)?.[childKey];
		if (!childContentId) {
		  console.warn(`No content found for child key: ${childKey}`);
		  return html`<div>No content for ${childKey}</div>`;
		}
		  console.log('ObjectBlock: createComponent id, path', childContentId, childPath);
		return ComponentFactory.createComponent(childContentId, childPath);
	  }

	protected renderContent(): TemplateResult {
		if (
			(!this.content) ||
			!this.model ||
			!(this.model as ObjectModel).properties
		) {
			return html`<div>Object Loading...</div>`;
		}

		const objectModel = this.model as ObjectModel;

		return html`
			<div class="object-content">
				${repeat(
					objectModel.properties,
					(prop) => prop.key!,
					(prop) => this.renderProperty(prop)
				)}
			</div>
		`;
	}

	private renderProperty(property: Model): TemplateResult {
		if (!property.key) {
			return html`<div>Invalid property</div>`;
		}

		const childKey = property.key;
		const childComponentPromise = this.childComponentPromises[childKey];

		if (!childComponentPromise) {
			return html`<div>Loading ${childKey}...</div>`;
		}

		return html`
			<div class="property-item">
				<span class="property-label">${property.name || childKey}:</span>
				<div class="property-content">
					${until(
						childComponentPromise,
						html`<span>Loading ${childKey}...</span>`,
						html`<span>Error loading ${childKey}</span>`
					)}
				</div>
			</div>
		`;
	}

	protected handleElementUpdate = async (event: Event) => {
		const customEvent = event as CustomEvent<{ id: string; value: any }>;
		const { id, value } = customEvent.detail;
		if (id.startsWith('inline:')) {
			const [, parentId, childKey] = id.split(':');
			if (parentId === this.contentId) {
				await this.updateContent((content) => ({
					...content,
					content: {
						...(content.content as Record<string, unknown>),
						[childKey]: value,
					},
				}));
				this.requestUpdate();
			}
		}
	};

}