import { LitElement, html, TemplateResult } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import type { Property, Model } from './model.ts';
import { UnifiedLibrary, resolveRefs } from './ModelLibrary.ts';

// Import all custom elements
import './BaseComponent';
import './ObjectComponent';
import './ArrayComponent';
import './ElementComponent';
import './GroupComponent';
import './DocumentComponent';

// ComponentFactory update
export class ComponentFactory {
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
