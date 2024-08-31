import { LitElement, html, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { until } from 'lit/directives/until.js';
import { Content, ContentId, isCompositeContent, isKeyedCompositeContent, KeyedCompositeContent } from '../content/content';
import { contentStore } from '../store';
import { ComponentFactory } from '../util/ComponentFactory';
import { libraryStore } from '../model/libraryStore';
import { Model, isObject } from '../model/model';

@customElement('path-renderer')
export class PathRenderer extends LitElement {
  @state() private targetContentId: string | null = null;
  @state() private targetProperty: string | null = null;
  @state() private error: string | null = null;

  @property({ type: String })
  path: string = '';

  updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('path')) {
      this.findTargetContent();
    }
  }

  private async findTargetContent() {
    this.error = null;
    this.targetContentId = null;
    this.targetProperty = null;
  
    const pathParts = this.path.split('.');
  
    if (pathParts.length === 0) {
      this.error = "Invalid path";
      return;
    }
  
    try {
      let currentContent: Content | undefined = await contentStore.getContent(pathParts[0]);
  
      if (!currentContent) {
        throw new Error(`Content not found for root: ${pathParts[0]}`);
      }
  
      for (let i = 1; i < pathParts.length; i++) {
        const part = pathParts[i];
        const childId = this.getChildId(currentContent, part);
  
        if (!childId) {
          // If we're at the last part and didn't find a child, it's a property
          if (i === pathParts.length - 1) {
            this.targetContentId = currentContent.id;
            this.targetProperty = part;
            return;
          }
          throw new Error(`Child content not found for key: ${part}`);
        }
  
        currentContent = await contentStore.getContent(childId);
        if (!currentContent) {
          throw new Error(`Content not found for id: ${childId}`);
        }
      }
  
      this.targetContentId = currentContent.id;
    } catch (error) {
      console.error('Error in findTargetContent:', error);
      this.error = error instanceof Error ? error.message : String(error);
    }
  
    this.requestUpdate();
  }

  private getChildId(content: Content, pathPart: string): ContentId | undefined {
    if (isCompositeContent(content)) {
      if (isKeyedCompositeContent(content)) {
        // Handle keyed composite (object)
        return (content.content as KeyedCompositeContent)[pathPart];
      } else if (Array.isArray(content.children)) {
        // Handle indexed composite (array or group)
        const { index } = this.parsePathPart(pathPart);
        if (!isNaN(index) && index >= 0 && index < content.children.length) {
          return content.children[index];
        }
      }
    }
    return undefined;
  }

  private parsePathPart(pathPart: string): { index: number, type?: string } {
    const parts = pathPart.split(':');
    return {
      index: parseInt(parts[0], 10),
      type: parts[1] // This will be undefined if there's no type
    };
  }

  render() {
    return html`
      <div>
        <p>PathRenderer is active. Current path: ${this.path}</p>
        ${this.error
          ? html`<div class="error">Error: ${this.error}</div>`
          : this.targetContentId
            ? html`<div>
                ${until(
                  this.renderTargetContent(),
                  html`<div>Loading content...</div>`,
                  html`<div>Error loading content</div>`
                )}
              </div>`
            : html`<div>Loading...</div>`
        }
      </div>
    `;
  }
    
  private async renderTargetContent(): Promise<TemplateResult> {
    if (!this.targetContentId) return html`<div>No target content found</div>`;
  
    const content = await contentStore.getContent(this.targetContentId);
    if (!content) return html`<div>Content not found</div>`;
  
    if (this.targetProperty) {
      // Render only the specific property
      let propertyModel: Model | undefined;
      if (content.modelDefinition && isObject(content.modelDefinition)) {
        propertyModel = content.modelDefinition.properties.find(p => p.key === this.targetProperty);
      }
  
      const propertyValue = content.content && typeof content.content === 'object' 
        ? (content.content as Record<string, any>)[this.targetProperty]
        : undefined;
  
      // Always use ComponentFactory to render the property
      return html`
        <div>
          ${await ComponentFactory.createComponent(
            `inline:${this.targetContentId}:${this.targetProperty}`,
            libraryStore.value,
            this.path,
            propertyModel,
            propertyValue
          )}
        </div>
      `;
    } else {
      // Render the entire content
      return ComponentFactory.createComponent(
        this.targetContentId,
        libraryStore.value,
        this.path
      );
    }
  }
  
}