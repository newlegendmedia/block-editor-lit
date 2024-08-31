import { html, css, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { until } from 'lit/directives/until.js';
import { KeyedCompositeBlock } from './KeyedCompositeBlock';
import { ComponentFactory } from '../util/ComponentFactory';
import { isObject, Model, isElement, ElementModel, AtomType, ObjectModel } from '../model/model';
import { KeyedCompositeContent } from '../content/content';

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
    this.inlineChildren = (this.model as ObjectModel)?.inlineChildren || false;
    await this.initializeChildComponents();
    this.addEventListener('element-updated', this.handleElementUpdate);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('element-updated', this.handleElementUpdate);
  }

  protected useInlineChildren(): boolean {
    return (this.model as ObjectModel)?.inlineChildren || false;
  }

  protected getModelProperties(): Model[] {
    return this.model && isObject(this.model) ? this.model.properties : [];
  }

  protected getDefaultValue(prop: ElementModel): any {
    switch (prop.base) {
      case AtomType.Boolean:
        return false;
      case AtomType.Number:
        return 0;
      case AtomType.Datetime:
        return new Date().toISOString();
      case AtomType.Text:
      case AtomType.Enum:
      case AtomType.File:
      case AtomType.Reference:
        return '';
      default:
        console.warn(`Unknown element base type: ${prop.base}`);
        return null;
    }
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
    const childPath = this.getChildPath(childKey);

    if (this.inlineChildren && isElement(property)) {
      const value = (this.content?.content as KeyedCompositeContent)?.[childKey] ?? null;
      return ComponentFactory.createComponent(
        `inline:${this.contentId}:${childKey}`,
        this.library!,
        childPath,
        property,
        value
      );
    }

    const childContentId = this.getChildBlockId(childKey);
    if (!childContentId) {
      console.warn(`No content found for child key: ${childKey}`);
      return html`<div>No content for ${childKey}</div>`;
    }

    return ComponentFactory.createComponent(childContentId, this.library!, childPath);
  }

  protected renderContent(): TemplateResult {
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

  private handleElementUpdate = async (event: Event) => {
    const customEvent = event as CustomEvent;
    const { id, value } = customEvent.detail;
    if (id.startsWith('inline:')) {
      const [, parentId, childKey] = id.split(':');
      if (parentId === this.contentId && this.content) {
        await this.updateContent(content => ({
          ...content,
          content: {
            ...(content.content as Record<string, unknown>),
            [childKey]: value,
          },
        }));
        this.requestUpdate();
      }
    }
  }
}