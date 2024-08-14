import { LitElement, html, TemplateResult } from 'lit';
import { property, customElement, state } from 'lit/decorators.js';
import type { Property, Model } from './model.ts';
import { isElement, isObject, isArray, isGroup } from './model.ts';
import { UnifiedLibrary, resolveRefs } from './ModelLibrary.ts';

// Import all custom elements
import './BaseComponent';
import './ObjectComponent';
import './ArrayComponent';
import './ElementComponent';
import './GroupComponent';
import './DocumentComponent';

export class ComponentFactory {
	static createComponent(model: Property, data: any, library: UnifiedLibrary): TemplateResult {
		const actualData = data && data.__type ? data.value : data;
		switch (model.type) {
			case 'object':
				return html`<object-component
					.library=${library}
					.model=${model}
					.data=${actualData}
				></object-component>`;
			case 'element':
				return html`<element-component .model=${model} .data=${actualData}></element-component>`;
			case 'array':
				return html`<array-component
					.library=${library}
					.model=${model}
					.data=${actualData}
				></array-component>`;
			case 'group':
				return html`<group-component
					.library=${library}
					.model=${model}
					.data=${actualData}
				></group-component>`;
			default:
				console.warn(`Unknown model type: ${(model as any).type}`);
				return html`<base-component
					.library=${library}
					.model=${model}
					.data=${actualData}
				></base-component>`;
		}
	}

	static createEmptyItem(itemType: Property): any {
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
		predefinedGroup: [
			{ __type: 'date', value: new Date().toISOString() },
			{ __type: 'author', value: { name: 'John Doe', email: 'john@example.com' } },
		],
		editableGroup: [
			{ __type: 'dateElement', value: new Date().toISOString() },
			{ __type: 'authorModel', value: { name: 'Jane Smith', email: 'jane@example.com' } },
			{ __type: 'dateElement', value: new Date().toISOString() },
		],
	};
	@state() private libraryErrors: string[] = [];

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
		this.libraryErrors = this.library.getErrors();
		this.requestUpdate();
	  }
	
	render() {
		if (this.libraryErrors.length > 0) {
			return html`
			  <h2>Library Errors</h2>
			  <ul>
				${this.libraryErrors.map(error => html`<li style="color: red;">${error}</li>`)}
			  </ul>
			`;
		  }
	  
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
				.library=${this.library}
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
