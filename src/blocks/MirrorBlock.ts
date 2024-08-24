import { html, css, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseBlock } from './BaseBlock';
import { contentStore } from '../content/ContentStore';
import { Content } from '../content/content';

@customElement('mirror-block')
export class MirrorBlock extends BaseBlock {
  @property({ type: String }) referencedContentId: string = '';

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

  connectedCallback() {
    super.connectedCallback();
    this.initializeContent();
    this.subscribeToReferencedContent();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribeFromReferencedContent();
  }

  private unsubscribeReferencedContent: (() => void) | null = null;

  private initializeContent() {
    const referencedContent = contentStore.getBlock(this.referencedContentId);
    if (referencedContent) {
      this.content = { ...referencedContent, id: `mirror:${referencedContent.id}` };
      this.model = this.getModel();
    } else {
      console.error(`MirrorBlock: Referenced content not found for ID ${this.referencedContentId}`);
    }
  }

  private subscribeToReferencedContent() {
    this.unsubscribeReferencedContent = contentStore.subscribeToBlock(
      this.referencedContentId,
      (content: Content) => {
        this.content = { ...content, id: `mirror:${content.id}` };
        this.requestUpdate();
      }
    );
  }

  private unsubscribeFromReferencedContent() {
    if (this.unsubscribeReferencedContent) {
      this.unsubscribeReferencedContent();
    }
  }

  protected renderContent(): TemplateResult {
    if (!this.content) {
      return html`<div>Error: Mirrored content not found</div>`;
    }

    return html`
      <div>
        <h3>Mirrored Content (Original ID: ${this.referencedContentId})</h3>
        <div class="mirror-content">
          <pre>${JSON.stringify(this.content, null, 2)}</pre>
        </div>
      </div>
    `;
  }

  protected getModel() {
    if (this.content) {
      return super.getModel();
    }
    return undefined;
  }
}