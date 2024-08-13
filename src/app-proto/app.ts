import { LitElement, html, css, TemplateResult } from 'lit';
import { property, customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { SimplifiedRenderTrackerMixin } from './render-tracker-mixin.ts';
import { AtomType, isElement, isObject, isArray, isGroup } from './model.ts';
import type { Property, Model, ArrayProperty, GroupProperty } from './model.ts';
import { UnifiedLibrary, resolveRefs } from './ModelLibrary.ts';

// ComponentFactory update
class ComponentFactory {
	static createComponent(model: Property, data: any): TemplateResult {
		switch (model.type) {
			case 'object':
				return html`<object-component .model=${model} .data=${data}></object-component>`;
			case 'array':
				return html`<array-component
					.model=${model}
					.data=${data}
					.repeatable=${model.repeatable || false}
				></array-component>`;
			case 'element':
				return html`<element-component .model=${model} .data=${data}></element-component>`;
			case 'group':
				return html`<group-component
					.model=${model}
					.data=${data}
					.editable=${model.editable || false}
				></group-component>`;
			default:
				console.warn(`Unknown model type: ${(model as any).type}`);
				return html`<base-component .model=${model} .data=${data}></base-component>`;
		}
	}
}

// Base Component
@customElement('base-component')
export class BaseComponent extends SimplifiedRenderTrackerMixin(LitElement) {
	@property({ type: Object }) model!: Property;
	@property({ type: Object }) data: any;
	@state() private showDebug: boolean = false;

	static styles = css`
		:host {
			display: block;
			margin-bottom: 10px;
			border: 1px solid #ddd;
			padding: 10px;
		}
		.debug-button {
			background-color: #f0f0f0;
			border: none;
			padding: 5px 10px;
			margin-bottom: 10px;
			cursor: pointer;
		}
		.debug-info {
			background-color: #f8f8f8;
			border: 1px solid #ddd;
			padding: 10px;
			white-space: pre-wrap;
			font-family: monospace;
		}
	`;

	render(): TemplateResult {
		return html`
			<button class="debug-button" @click=${this.toggleDebug}>
				${this.showDebug ? 'Hide' : 'Show'} Debug Info
			</button>
			${this.showDebug ? this.renderDebugInfo() : ''}
			<div>${this.renderContent()}</div>
		`;
	}

	protected renderContent(): TemplateResult {
		return html`<div>${this.model.name}: ${JSON.stringify(this.data)}</div>`;
	}

	private toggleDebug() {
		this.showDebug = !this.showDebug;
	}

	private renderDebugInfo(): TemplateResult {
		const debugInfo = {
			model: this.model,
			data: this.data,
		};
		return html`
			<div class="debug-info">
				<h4>Debug Information</h4>
				<pre>${JSON.stringify(debugInfo, null, 2)}</pre>
			</div>
		`;
	}

	protected handleValueChanged(e: CustomEvent) {
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

// Object Component
@customElement('object-component')
class ObjectComponent extends BaseComponent {
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

// Array Component
@customElement('array-component')
class ArrayComponent extends BaseComponent {
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

// Element Component
@customElement('element-component')
class ElementComponent extends BaseComponent {
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

// Group Component
@customElement('group-component')
class GroupComponent extends BaseComponent {
	@property({ type: Boolean }) editable: boolean = false;
	@state() private showMenu: boolean = false;

	override renderContent(): TemplateResult {
		if (!isGroup(this.model)) {
			console.warn('Invalid model type for GroupComponent');
			return html``;
		}
		return html`
			<fieldset>
				<legend>${this.model.name}</legend>
				${repeat(
					Object.entries(this.data || {}),
					([key]) => key,
					([key, value]) => ComponentFactory.createComponent(this.getItemTypeByKey(key), value)
				)}
				${this.editable ? this.renderAddButton() : ''}
				${this.showMenu ? this.renderSlashMenu() : ''}
			</fieldset>
		`;
	}

	private renderAddButton(): TemplateResult {
		return html`<button @click=${this.toggleSlashMenu}>Add Block</button>`;
	}

	private renderSlashMenu(): TemplateResult {
		return html`
			<div class="slash-menu">
				${repeat(
					(this.model as GroupProperty).itemTypes,
					(itemType) => itemType.key,
					(itemType) => html`
						<button @click=${() => this.addBlock(itemType)}>
							${itemType.name || itemType.key}
						</button>
					`
				)}
			</div>
		`;
	}

	private toggleSlashMenu() {
		this.showMenu = !this.showMenu;
	}

	private addBlock(itemType: Property) {
		const newData = { ...this.data, [itemType.key!]: this.createEmptyItem(itemType) };
		this.data = newData;
		this.showMenu = false;
		this.requestUpdate();
		this.dispatchEvent(
			new CustomEvent('value-changed', {
				detail: { key: this.model.key, value: this.data },
				bubbles: true,
				composed: true,
			})
		);
	}

	private getItemTypeByKey(key: string): Property {
		return (
			(this.model as GroupProperty).itemTypes.find((itemType) => itemType.key === key) ||
			(this.model as GroupProperty).itemTypes[0]
		);
	}

	private createEmptyItem(itemType: Property): any {
		// Implementation similar to ArrayComponent's createEmptyItem method
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
	}
}

// Document Component
@customElement('document-component')
class DocumentComponent extends LitElement {
	@property({ type: Object }) documentModel!: Model;
	@property({ type: Object }) documentData: any = {};

	static styles = css`
		:host {
			display: block;
			font-family: Arial, sans-serif;
			max-width: 800px;
			margin: 0 auto;
			padding: 20px;
		}
	`;

	constructor() {
		super();
		this.addEventListener('value-changed', this.handleValueChanged as EventListener);
	}

	render() {
		return html`
			${ComponentFactory.createComponent(this.documentModel, this.documentData)}
			<button @click=${this.saveDocument}>Save Document</button>
		`;
	}

	handleValueChanged(e: CustomEvent) {
		const { key, value } = e.detail;
		this.documentData = { ...this.documentData, [key]: value };
		this.requestUpdate();
	}

	saveDocument() {
		console.log('Saving document:', this.documentData);
		// Implement actual save functionality here
	}
}

@customElement('app-component')
export class AppComponent extends LitElement {
	private library: UnifiedLibrary;

	@property({ type: Object }) documentModel?: Property;
	@property({ type: Object }) documentData: any = {
		title: 'My Document',
		sections: [
			{ heading: 'Introduction', body: 'This is the introduction.' },
			{ heading: 'Conclusion', body: 'This is the conclusion.' },
		],
		footer: {
			date: new Date().toISOString(),
			author: {
				name: 'John Doe',
				email: 'john@example.com',
			},
		},
	};

	constructor() {
		super();
		this.library = new UnifiedLibrary();
		this.loadDocumentModel();
	}

	loadDocumentModel() {
		const rawModel = this.library.getDefinition('document', 'object') as Model;
		if (rawModel) {
			this.documentModel = resolveRefs(rawModel, this.library) as Model;
		}
		this.requestUpdate();
	}

	render() {
		if (!this.documentModel) {
			return html`<p>Loading...</p>`;
		}

		return html`
			<h2>Reactivity Test Panel</h2>
			<button @click=${this.changeTitle}>Change Title</button>
			<button @click=${this.changeSectionHeading}>Change Section Heading</button>
			<button @click=${this.addSection}>Add Section</button>
			<button @click=${this.removeSection}>Remove Section</button>
			<button @click=${this.changeMetadata}>Change Metadata</button>
			<document-component
				.documentModel=${this.documentModel}
				.documentData=${this.documentData}
			></document-component>
		`;
	}

	changeTitle() {
		this.documentData = {
			...this.documentData,
			title: `New Title ${Date.now()}`,
		};
	}

	changeSectionHeading() {
		if (this.documentData.content.sections.length > 0) {
			const newSections = [...this.documentData.content.sections];
			newSections[0] = {
				...newSections[0],
				heading: `New Heading ${Date.now()}`,
			};
			this.documentData = {
				...this.documentData,
				content: {
					...this.documentData.content,
					sections: newSections,
				},
			};
		}
	}

	addSection() {
		this.documentData = {
			...this.documentData,
			content: {
				...this.documentData.content,
				sections: [
					...this.documentData.content.sections,
					{ heading: `New Section ${Date.now()}`, body: 'New section content' },
				],
			},
		};
	}

	removeSection() {
		if (this.documentData.content.sections.length > 0) {
			const newSections = [...this.documentData.content.sections];
			newSections.pop();
			this.documentData = {
				...this.documentData,
				content: {
					...this.documentData.content,
					sections: newSections,
				},
			};
		}
	}

	changeMetadata() {
		this.documentData = {
			...this.documentData,
			metadata: {
				...this.documentData.metadata,
				author: `New Author ${Date.now()}`,
				createdAt: new Date().toISOString(),
			},
		};
	}
}

// Usage
const app = document.querySelector('#app');
if (app) {
	const appComponent = document.createElement('app-component') as AppComponent;
	app.appendChild(appComponent);
}
