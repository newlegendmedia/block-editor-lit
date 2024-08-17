import { html, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { Property, Model } from '../util/model.ts';
import { isElement, isObject, isArray, isGroup } from '../util/model.ts';
import { resolveRefs } from '../library/ModelLibrary.ts';
import { BaseBlock } from './BaseBlock.ts';

// Import all custom elements
import './BaseBlock.ts';
import './ObjectBlock.ts';
import './ArrayBlock.ts';
import './ElementBlock.ts';
import './GroupBlock.ts';
import './DocumentBlock.ts';
import '../util/DebugController.ts';
import '../util/ThemeSwitcher.ts';

export class ComponentFactory {
	static createComponent(model: Property, data: any): TemplateResult {
	  let actualData = data && data.__type ? data.value : data;
	  const emptyData = this.createEmptyItem(model);
	  actualData = actualData ?? emptyData;
    
	  switch (model.type) {
		case 'object':
		  return html`<object-component
			.model=${model}
			.data=${actualData}
		  ></object-component>`;
		case 'element':
		  return html`<element-component .model=${model} .data=${actualData}></element-component>`;
		case 'array':
		  return html`<array-component
			.model=${model}
			.data=${actualData}
		  ></array-component>`;
		case 'group':
		  return html`<group-component
			.model=${model}
			.data=${actualData}
		  ></group-component>`;
		default:
		  console.warn(`Unknown model type: ${(model as any).type}`);
		  return html`<base-component
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
			return [];
		}
		return null;
	}
}

@customElement('app-component')
export class AppComponent extends BaseBlock {
  @state() private documentModel?: Property;
  @state() private documentData: any = {
    "title": "My First Notion++ Page",
    "createdOn": "2023-08-15T09:30:00Z",
    "lastUpdated": "2023-08-15T14:45:00Z",
    "tags": "productivity, notes, organization",
    "page": {
      // The content of the page would go here, but it's not included in this dummy data
      // as per your request to only include properties up to the group
    }    
  };

  protected override onLibraryReady() {
    this.loadDocumentModel();
  }

  loadDocumentModel() {
    if (!this.library) {
      console.warn('Library not available when loading document model');
      return;
    }
    const rawModel = this.library.getDefinition('notion', 'object') as Model;
    if (rawModel) {
      this.documentModel = resolveRefs(rawModel, this.library) as Model;
    }
    this.requestUpdate();
  }

  override render(): TemplateResult {
    if (!this.libraryReady) {
      return html`<p>Loading library...</p>`;
    }

    if (this.library && this.library?.getErrors().length > 0) {
      return html`
        <h2>Library Errors</h2>
        <ul>
          ${this.library.getErrors().map(error => html`<li style="color: red;">${error}</li>`)}
        </ul>
      `;
    }

    if (!this.documentModel) {
      return html`<p>Loading document model...</p>`;
    }

    // <h2>Reactivity Test Panel</h2>
    // <debug-controller></debug-controller>
    // <button @click=${this.changeTitle}>Change Title</button>
    // <button @click=${this.changeSectionHeading}>Change Section Heading</button>
    // <button @click=${this.addSection}>Add Section</button>
    // <button @click=${this.removeSection}>Remove Section</button>
    // <button @click=${this.changeMetadata}>Change Metadata</button>
    return html`
      <theme-switcher></theme-switcher>
      ${this.renderDocument()}
    `;
  }

  private renderDocument(): TemplateResult {
    if (!this.documentModel || !this.library) {
      return html`<p>Document model or library not available</p>`;
    }
    return html`
      <debug-controller></debug-controller>
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

	// {
	// 	title: 'My Document',
	// 	sections: [
	// 		{ heading: 'Introduction', body: 'This is the introduction.' },
	// 		{ heading: 'Conclusion', body: 'This is the conclusion.' },
	// 	],
	// 	predefinedGroup: [
	// 		{ __type: 'date', value: new Date().toISOString() },
	// 		{ __type: 'author', value: { name: 'John Doe', email: 'john@example.com' } },
	// 	],
	// 	editableGroup: [
	// 		{ __type: 'dateElement', value: new Date().toISOString() },
	// 		{ __type: 'authorModel', value: { name: 'Jane Smith', email: 'jane@example.com' } },
	// 		{ __type: 'dateElement', value: new Date().toISOString() },
	// 	],
	// };

		// return html`
		//   <h2>Reactivity Test Panel</h2>
		//   <debug-controller></debug-controller>
		//   <button @click=${this.changeTitle}>Change Title</button>
		//   <button @click=${this.changeSectionHeading}>Change Section Heading</button>
		//   <button @click=${this.addSection}>Add Section</button>
		//   <button @click=${this.removeSection}>Remove Section</button>
		//   <button @click=${this.changeMetadata}>Change Metadata</button>		

// Usage
const app = document.querySelector('#app');
if (app) {
	const appComponent = document.createElement('app-component') as AppComponent;
	app.appendChild(appComponent);
}
