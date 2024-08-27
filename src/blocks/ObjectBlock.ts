import { html, css, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { until } from 'lit/directives/until.js';
import { KeyedCompositeBlock } from './KeyedCompositeBlock';
import { ComponentFactory } from '../util/ComponentFactory';
import { isObject, Model, isElement } from '../model/model';
//import { Content } from '../content/content';

@customElement('object-block')
export class ObjectBlock extends KeyedCompositeBlock {
  @state() private childComponentPromises: Record<string, Promise<TemplateResult>> = {};

  static styles = [
    KeyedCompositeBlock.styles,
    css`
      .object-content {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-small);
      }
    `,
  ];

  async connectedCallback() {
    await super.connectedCallback();
    await this.initializeChildBlocks();
    await this.initializeChildComponents();
  }

  private async initializeChildComponents() {
    if (!this.model || !isObject(this.model)) return;
  
    const componentPromises: Record<string, Promise<TemplateResult>> = {};
    for (const prop of this.model.properties) {
      if (prop.key) {
        componentPromises[prop.key] = this.createChildComponent(prop);
      }
    }
  
    this.childComponentPromises = componentPromises;
    this.requestUpdate();
  }

  private async createChildComponent(property: Model): Promise<TemplateResult> {
    if (!property.key) {
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
    if (!childContentId) {
      return html`<div>No content for ${childKey}</div>`;
    }

    return ComponentFactory.createComponent(childContentId, this.library!, childPath);
  }

  protected renderContent(): TemplateResult {
    if (!this.content || !this.library || !this.model || !isObject(this.model)) {
      ;
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
    const childComponentPromise = this.childComponentPromises[childKey];

    if (!childComponentPromise) {
      return html`<div>Loading ${childKey}...</div>`;
    }

    return html`
      <div>
        <strong>${property.name || childKey}:</strong>
        ${until(
          childComponentPromise,
          html`<span>Loading...</span>`,
          html`<span>Error loading component</span>`
        )}
      </div>
    `;
  }

  // private async handleInlineElementUpdate(event: CustomEvent) {
  //   const { id, value } = event.detail;
  //   if (id.startsWith('inline:')) {
  //     const [, parentId, childKey] = id.split(':');
  //     if (parentId === this.contentId && this.content) {
  //       await this.updateContent(content => {
  //         const updatedContent = {
  //           ...content,
  //           content: {
  //             ...(content.content as Record<string, unknown>),
  //             [childKey]: value,
  //           },
  //         };
  //         return updatedContent as Content;
  //       });
  //     }
  //   }
  // }
}