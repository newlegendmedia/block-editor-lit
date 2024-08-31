// MirrorBlock.ts

import { html, css, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { BaseBlock } from './BaseBlock';
import { contentStore } from '../store';
import { Content } from '../content/content';

@customElement('mirror-block')
export class MirrorBlock extends BaseBlock {
  @property({ type: String }) referencedContentId: string = '';
  @state() private mirroredContent: Content | undefined = undefined;

  static styles = [
    BaseBlock.styles,
    css`
      .mirror-content {
        border: 2px dashed var(--border-color);
        padding: var(--spacing-medium);
        margin-top: var(--spacing-small);
      }
    `
  ];

  async connectedCallback() {
    super.connectedCallback();
    await this.initializeContent();
    this.subscribeToReferencedContent();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribeFromReferencedContent();
  }

  private unsubscribeReferencedContent: (() => void) | null = null;

  async initializeContent() {
    try {
      const referencedContent = await contentStore.getContent(this.referencedContentId);
      if (referencedContent) {
        this.mirroredContent = { ...referencedContent, id: `mirror:${referencedContent.id}` };
        this.content = this.mirroredContent;
        this.model = this.getModel();
        this.requestUpdate();
      } else {
        console.error(`MirrorBlock: Referenced content not found for ID ${this.referencedContentId}`);
      }
    } catch (error) {
      console.error(`MirrorBlock: Error initializing content:`, error);
    }
  }

  private subscribeToReferencedContent() {
    this.unsubscribeReferencedContent = contentStore.subscribeToContent(
      this.referencedContentId,
      (content: Content | undefined) => {
        if (content) {
          this.mirroredContent = { ...content, id: `mirror:${content.id}` };
          this.content = this.mirroredContent;
          this.model = this.getModel();
          this.requestUpdate();
        } else {
          this.mirroredContent = undefined;
          this.content = undefined;
          this.model = undefined;
          this.requestUpdate();
        }
      }
    );
  }

  private unsubscribeFromReferencedContent() {
    if (this.unsubscribeReferencedContent) {
      this.unsubscribeReferencedContent();
    }
  }

  protected renderContent(): TemplateResult {
    if (!this.mirroredContent) {
      return html`<div>Error: Mirrored content not found</div>`;
    }

    return html`
      <div>
        <h3>Mirrored Content (Original ID: ${this.referencedContentId})</h3>
        <div class="mirror-content">
          ${this.renderMirroredContent()}
        </div>
      </div>
    `;
  }

  private renderMirroredContent(): TemplateResult {
    if (!this.mirroredContent) {
      return html`<div>Error: Mirrored content not available</div>`;
    }

    // You can customize this part to render the mirrored content as needed
    return html`
      <pre>${JSON.stringify(this.mirroredContent, null, 2)}</pre>
    `;
  }

  protected getModel() {
    if (this.mirroredContent) {
      return super.getModel();
    }
    return undefined;
  }
}