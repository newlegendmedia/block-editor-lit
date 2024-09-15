import { html, css, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { until } from 'lit/directives/until.js';
import { KeyedCompositeBlock } from './KeyedCompositeBlock';
import { ComponentFactory } from '../util/ComponentFactory';
import { ObjectModel, Model, isElement, ElementModel } from '../model/model';
import { KeyedCompositeContent } from '../content/content';

@customElement('object-block')
export class ObjectBlock extends KeyedCompositeBlock {
	@state() private childComponents: Map<string, Promise<TemplateResult>> = new Map();
	@state() private isInitialized: boolean = false;

	static styles = [
		css`
			.object-content {
				display: flex;
				flex-direction: column;
				gap: var(--spacing-small);
			}
			.property-content {
				flex: 1;
			}
			.property-item {
				display: flex;
				align-items: flex-start;
				gap: var(--spacing-small);
				margin-top: var(--spacing-small);
			}
			.property-label {
				font-weight: bold;
				font-size: 14px;
				width: 90px;
				margin-top: 6px;
			}
			label {
				font-size: 13px;
			}
		`,
	];

	protected getModelProperties(): Model[] {
		return (this.model as ObjectModel)?.properties || [];
	}

	protected getDefaultValue(prop: Model): any {
		if (isElement(prop)) {
			const elementModel = prop as ElementModel;
			switch (elementModel.base) {
				case 'boolean':
					return false;
				case 'number':
					return 0;
				case 'datetime':
					return new Date().toISOString();
				case 'text':
					return '';
				default:
					return null;
			}
		}
		return null;
	}

	protected async initializeBlock() {
		await super.initializeBlock();
		this.inlineChildren = this.useInlineChildren();
		await this.initializeChildComponents();
		this.isInitialized = true;
		this.requestUpdate();
	}

	private async initializeChildComponents() {
		const objectModel = this.model as ObjectModel;

		const componentPromises = objectModel.properties.map(async (prop) => {
			if (!prop.key) return;
			const childKey = prop.key;
			const childComponent = await this.createChildComponent(prop);
			this.childComponents.set(childKey, Promise.resolve(childComponent));
		});

		await Promise.all(componentPromises);
	}

	protected render(): TemplateResult<1> {
		if (!this.isInitialized) {
			return html`<div>Initializing object...</div>`;
		}
		return this.renderContent();
	}

	protected renderContent(): TemplateResult<1> {
		if (!this.content || !this.model || !(this.model as ObjectModel).properties) {
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

	private renderProperty(property: Model): TemplateResult<1> {
		if (!property.key) {
			return html`<div>Invalid property</div>`;
		}

		const childKey = property.key;
		const childComponentPromise = this.childComponents.get(childKey);

		if (!childComponentPromise) {
			console.warn(`No child component found for key: ${childKey}`);
			return html`<div>No component for ${childKey}</div>`;
		}

		return html`
			<div class="property-item">
				<span class="property-label">${property.name || childKey}:</span>
				<div class="property-content">
					${until(childComponentPromise, html`<span>Loading ${childKey}...</span>`)}
				</div>
			</div>
		`;
	}

	private async createChildComponent(property: Model): Promise<TemplateResult> {
		const childKey = property.key!;
		try {
			if (this.inlineChildren && isElement(property)) {
				return await this.createInlineChildComponent(property, childKey, this.path);
			} else {
				return await this.createStandardChildComponent(property, childKey, this.path);
			}
		} catch (error) {
			console.error(`Error creating child component for ${childKey}:`, error);
			return html`<div>Error: ${(error as Error).message}</div>`;
		}
	}

	private async createInlineChildComponent(
		property: Model,
		childKey: string,
		parentPath: string
	): Promise<TemplateResult> {
		const contentData = this.content?.content as KeyedCompositeContent;
		const value = contentData?.[childKey];
		return await ComponentFactory.createComponent(
			`inline:${this.contentId}:${childKey}`,
			parentPath,
			property,
			value
		);
	}

	private async createStandardChildComponent(
		_property: Model,
		childKey: string,
		parentPath: string
	): Promise<TemplateResult> {
		const contentData = this.content?.content;
		const childContentId = (contentData as { [key: string]: any })?.[childKey];

		if (!childContentId) {
			console.warn(`No content found for child key: ${childKey}`, this.content);
			return html`<div>No content for ${childKey}</div>`;
		}
		return await ComponentFactory.createComponent(childContentId, parentPath);
	}

	protected useInlineChildren(): boolean {
		return (this.model as ObjectModel)?.inlineChildren || false;
	}
}
