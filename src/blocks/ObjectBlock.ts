import { html, css, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { until } from 'lit/directives/until.js';
import { KeyedCompositeBlock } from './KeyedCompositeBlock';
import { BlockFactory } from './BlockFactory';
import { ObjectModel, Model, isElement } from '../model/model';
import { KeyedCompositeContent } from '../content/content';
import { contentStore } from '../content/ContentStore';

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
			const childComponent = await this.createChildComponent(prop, childKey);
			this.childComponents.set(childKey, Promise.resolve(childComponent));
		});

		await Promise.all(componentPromises);
	}

	render(): TemplateResult<1> {
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

	private async createChildComponent(property: Model, childKey: string): Promise<TemplateResult> {
		try {
			if (this.inlineChildren && isElement(property)) {
				return await this.createInlineChildComponent(property, childKey, this.path.toString());
			} else {
				return await this.createStandardChildComponent(property, childKey, this.path.toString());
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
		return await BlockFactory.createComponent(
			parentPath,
			`inline:${this.content?.id}:${childKey}`,
			property.type,
			value
		);
	}

	private async createStandardChildComponent(
		property: Model,
		childKey: string,
		parentPath: string
	): Promise<TemplateResult> {
		// Let BlockFactory create or retrieve the content
		const component = await BlockFactory.createComponent(parentPath, childKey, property.type);

		// After BlockFactory creates the component, update this.content
		await this.updateChildContentReference(childKey);

		return component;
	}

	private async updateChildContentReference(childKey: string): Promise<void> {
		if (!this.content) return;

		const childPath = this.getChildPath(childKey);
		const childContent = await contentStore.getByPath(childPath);

		if (childContent) {
			await this.updateContent((currentContent) => {
				const updatedContent = { ...currentContent };
				(updatedContent.content as KeyedCompositeContent)[childKey] = childContent.id;
				return updatedContent;
			});
		}
	}

	protected useInlineChildren(): boolean {
		return (this.model as ObjectModel)?.inlineChildren || false;
	}
}
