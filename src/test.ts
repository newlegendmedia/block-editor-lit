import { LitElement, html, css, TemplateResult } from 'lit';
import { property, customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { SimplifiedRenderTrackerMixin } from './proto/render-tracker-mixin.ts';

// Types
// Enhanced ModelDefinition
type ModelDefinition = {
    key: string;
    label: string;
    type: 'object' | 'array' | 'element' | 'group';
    properties?: ModelDefinition[];
    items?: ModelDefinition;
    atom?: AtomType;
    templateKey?: string;
};
  
enum AtomType {
  Text,
  Datetime,
}

// Template Library
// class TemplateLibrary {
//   private static templates: Map<string, (model: ModelDefinition, data: any) => TemplateResult> = new Map();

//   static registerTemplate(key: string, template: (model: ModelDefinition, data: any) => TemplateResult) {
//     this.templates.set(key, template);
//   }

//   static getTemplate(key: string): (model: ModelDefinition, data: any) => TemplateResult {
//     return this.templates.get(key) || this.getDefaultTemplate(key);
//   }

//   private static getDefaultTemplate(type: string): (model: ModelDefinition, data: any) => TemplateResult {
//     switch (type) {
//       case 'object':
//         return (model, data) => html`<object-component .model=${model} .data=${data}></object-component>`;
//       case 'array':
//         return (model, data) => html`<array-component .model=${model} .data=${data}></array-component>`;
//       case 'element':
//         return (model, data) => html`<element-component .model=${model} .data=${data}></element-component>`;
//       case 'group':
//         return (model, data) => html`<group-component .model=${model} .data=${data}></group-component>`;
//       default:
//         return (model, data) => html`<base-component .model=${model} .data=${data}></base-component>`;
//     }
//   }
// }

// ComponentFactory update
class ComponentFactory {
    static createComponent(model: ModelDefinition, data: any): TemplateResult {
      // Use default components based on type
//      alert('component factory for ' + model.type + ' ' + model.key);
        switch (model.type) {
          case 'object':
            return html`<object-component .model=${model} .data=${data}></object-component>`;
          case 'array':
            return html`<array-component .model=${model} .data=${data}></array-component>`;
          case 'element':
            return html`<element-component .model=${model} .data=${data}></element-component>`;
          case 'group':
            return html`<group-component .model=${model} .data=${data}></group-component>`;
          default:
            alert('default for ' + model.type);
            return html`<base-component .model=${model} .data=${data}></base-component>`;
        }
    //   }
    }
  }

// Base Component
@customElement('base-component')
export class BaseComponent extends SimplifiedRenderTrackerMixin(LitElement) {
  @property({ type: Object }) model!: ModelDefinition;
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
    return html`<div>${this.model.label}: ${JSON.stringify(this.data)}</div>`;
  }

  private toggleDebug() {
    this.showDebug = !this.showDebug;
  }

  private renderDebugInfo(): TemplateResult {
    const debugInfo = {
      model: this.model,
      data: this.data
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
    this.dispatchEvent(new CustomEvent('value-changed', { 
      detail: { key: this.model.key, value: this.data },
      bubbles: true,
      composed: true
    }));
  }
}

// Object Component
@customElement('object-component')
class ObjectComponent extends BaseComponent {
  override renderContent(): TemplateResult {
    if (this.model.templateKey) {
      return ComponentFactory.createComponent(this.model, this.data);
    }
    return html`
      <div>
        <h2>${this.model.label}</h2>
        ${repeat(this.model.properties || [], prop => prop.key, prop => 
          ComponentFactory.createComponent(prop, this.data?.[prop.key])
        )}
      </div>
    `;
  }
}

// Array Component
@customElement('array-component')
class ArrayComponent extends BaseComponent {
  override renderContent(): TemplateResult {
    if (this.model.templateKey) {
      return ComponentFactory.createComponent(this.model, this.data);
    }
    return html`
      <div>
        <h3>${this.model.label}</h3>
        ${repeat(this.data || [], (item, index) => index, item => 
          ComponentFactory.createComponent(this.model.items!, item)
        )}
      </div>
    `;
  }
}

// Element Component
@customElement('element-component')
class ElementComponent extends BaseComponent {
  override renderContent(): TemplateResult {
    if (this.model.templateKey) {
      return ComponentFactory.createComponent(this.model, this.data);
    }
    switch (this.model.atom) {
      case AtomType.Text:
        return html`<input type="text" .value=${this.data || ''} @input=${this.handleInput}>`;
      case AtomType.Datetime:
        return html`<input type="datetime-local" .value=${this.data || ''} @input=${this.handleInput}>`;
      default:
        return html`<span>${this.data}</span>`;
    }
  }

  private handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    this.data = target.value;
    this.dispatchEvent(new CustomEvent('value-changed', {
      detail: { key: this.model.key, value: this.data },
      bubbles: true,
      composed: true
    }));
  }
}

// Group Component
@customElement('group-component')
class GroupComponent extends BaseComponent {
  override renderContent(): TemplateResult {
    if (this.model.templateKey) {
      return ComponentFactory.createComponent(this.model, this.data);
    }
    return html`
      <fieldset>
        <legend>${this.model.label}</legend>
        ${repeat(this.model.properties || [], prop => prop.key, prop => 
          ComponentFactory.createComponent(prop, this.data?.[prop.key])
        )}
      </fieldset>
    `;
  }
}

// Document Component
@customElement('document-component')
class DocumentComponent extends LitElement {
  @property({ type: Object }) documentModel!: ModelDefinition;
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
    return ComponentFactory.createComponent(this.documentModel, this.documentData);
  }

  handleValueChanged(e: CustomEvent) {
    const { key, value } = e.detail;
    this.documentData = { ...this.documentData, [key]: value };
    this.requestUpdate();
  }
}

// Main App Component
@customElement('app-component')
export class AppComponent extends LitElement {  
  @property({ type: Object }) documentModel: ModelDefinition = {
    key: 'document',
    label: 'Document',
    type: 'object',
    properties: [
      {
        type: 'element',
        key: 'title',
        label: 'Document Title',
        atom: AtomType.Text
      },
      {
        type: 'group',
        key: 'content',
        label: 'Document Content',
        properties: [
          {
            type: 'array',
            key: 'sections',
            label: 'Sections',
            items: {
              type: 'object',
              key: 'section',
              label: 'Section',
              properties: [
                {
                  type: 'element',
                  key: 'heading',
                  label: 'Section Heading',
                  atom: AtomType.Text
                },
                {
                  type: 'element',
                  key: 'body',
                  label: 'Section Body',
                  atom: AtomType.Text,
                }
              ]
            }
          }
        ]
      },
      {
        type: 'object',
        key: 'metadata',
        label: 'Document Metadata',
        properties: [
          {
            type: 'element',
            key: 'author',
            label: 'Author',
            atom: AtomType.Text
          },
          {
            type: 'element',
            key: 'createdAt',
            label: 'Created At',
            atom: AtomType.Datetime
          }
        ]
      }
    ]
  };

  @property({ type: Object }) documentData: any = {
    title: 'My Document',
    content: {
      sections: [
        { heading: 'Introduction', body: 'This is the introduction.' },
        { heading: 'Conclusion', body: 'This is the conclusion.' }
      ]
    },
    metadata: {
      author: 'John Doe',
      createdAt: '2023-04-20T10:00:00'
    }
  };

  constructor() {
    super();
//    this.registerCustomTemplates();
  }

  // registerCustomTemplates() {
  //   TemplateLibrary.registerTemplate('customTextarea', (model, data) => html`
  //     <div>
  //       <label for="${model.key}">${model.label}</label>
  //       <textarea id="${model.key}" .value=${data || ''} @input=${(e: Event) => {
  //         const target = e.target as HTMLTextAreaElement;
  //         target.dispatchEvent(new CustomEvent('value-changed', {
  //           detail: { key: model.key, value: target.value },
  //           bubbles: true,
  //           composed: true
  //         }));
  //       }}></textarea>
  //     </div>
  //   `);
  // }

  changeTitle() {
    this.documentData = {
      ...this.documentData,
      title: `New Title ${Date.now()}`
    };
  }

  changeSectionHeading() {
    if (this.documentData.content.sections.length > 0) {
      const newSections = [...this.documentData.content.sections];
      newSections[0] = {
        ...newSections[0],
        heading: `New Heading ${Date.now()}`
      };
      this.documentData = {
        ...this.documentData,
        content: {
          ...this.documentData.content,
          sections: newSections
        }
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
          { heading: `New Section ${Date.now()}`, body: 'New section content' }
        ]
      }
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
          sections: newSections
        }
      };
    }
  }

  changeMetadata() {
    this.documentData = {
      ...this.documentData,
      metadata: {
        ...this.documentData.metadata,
        author: `New Author ${Date.now()}`,
        createdAt: new Date().toISOString()
      }
    };
  }
  
  render() {
    return html`
      <h2>Reactivity Test Panel</h2>
      <button @click=${this.changeTitle}>Change Title</button>
      <button @click=${this.changeSectionHeading}>Change Section Heading</button>
      <button @click=${this.addSection}>Add Section</button>
      <button @click=${this.removeSection}>Remove Section</button>
      <button @click=${this.changeMetadata}>Change Metadata</button>
      <document-component .documentModel=${this.documentModel} .documentData=${this.documentData}></document-component>
    `;
  }

}

// declare global {
//   interface HTMLElementTagNameMap {
//     "base-component": BaseComponent;
//     "object-component": ObjectComponent;
//     "array-component": ArrayComponent;
//     "element-component": ElementComponent;
//     "group-component": GroupComponent;
//     "document-component": DocumentComponent;
//     "app-component": AppComponent;
//   }
// }

// Usage
const app = document.querySelector('#app');
if (app) {
  const appComponent = document.createElement('app-component') as AppComponent;
  app.appendChild(appComponent);
}