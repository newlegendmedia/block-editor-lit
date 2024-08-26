import { html, TemplateResult } from 'lit';
import { contentStore } from '../store/ContentStore';
import { ModelLibrary } from '../model/libraryStore';
import { Model } from '../model/model';
import { Content, ContentId } from '../content/content';

// Import your block components
import '../blocks/ObjectBlock';
import '../blocks/ArrayBlock';
import '../blocks/ElementBlock';
import '../blocks/GroupBlock';
import '../blocks/MirrorBlock';

export class ComponentFactory {
  static async createComponent(
    contentId: string,
    library: ModelLibrary,
    path: string,
    inlineModel?: Model
  ): Promise<TemplateResult> {
    // Handle inline elements
    if (contentId.startsWith('inline:')) {
      return this.createInlineElement(contentId, library, path, inlineModel);
    }

    // Handle mirror blocks
    if (contentId.startsWith('mirror:')) {
      return this.createMirrorBlock(contentId, library, path);
    }

    // Fetch content for regular blocks
    let content: Content | undefined;
    try {
      content = await contentStore.getContent(contentId);
    } catch (error) {
      console.error(`Error fetching content for ID ${contentId}:`, error);
      return html`<div>Error: Failed to load content</div>`;
    }

    if (!content) {
      return html`<div>Error: Content not found</div>`;
    }

    const fullPath = path || content.modelInfo.key;

    // Create the appropriate block based on content type
    switch (content.modelInfo.type) {
      case 'object':
        return this.createObjectBlock(contentId, library, fullPath);
      case 'array':
        return this.createArrayBlock(contentId, library, fullPath);
      case 'element':
        return this.createElementBlock(contentId, library, fullPath);
      case 'group':
        return this.createGroupBlock(contentId, library, fullPath);
      default:
        console.warn(`Unknown content type: ${content.modelInfo.type}`);
        return html`<div>Unknown content type: ${content.modelInfo.type}</div>`;
    }
  }

  private static createInlineElement(
    contentId: string,
    library: ModelLibrary,
    path: string,
    inlineModel?: Model
  ): Promise<TemplateResult> {
    return Promise.resolve(html`
      <element-block
        .contentId=${contentId}
        .library=${library}
        .path=${path}
        .inlineModel=${inlineModel}
        .isInline=${true}
      ></element-block>
    `);
  }

  private static createMirrorBlock(
    contentId: string,
    library: ModelLibrary,
    path: string
  ): Promise<TemplateResult> {
    const originalId = contentId.split(':')[1];
    return Promise.resolve(html`
      <mirror-block
        .contentId=${contentId}
        .referencedContentId=${originalId}
        .library=${library}
        .path=${path}
      ></mirror-block>
    `);
  }

  private static createObjectBlock(
    contentId: ContentId,
    library: ModelLibrary,
    path: string
  ): Promise<TemplateResult> {
    return Promise.resolve(html`
      <object-block
        .contentId=${contentId}
        .library=${library}
        .path=${path}
      ></object-block>
    `);
  }

  private static createArrayBlock(
    contentId: ContentId,
    library: ModelLibrary,
    path: string
  ): Promise<TemplateResult> {
    return Promise.resolve(html`
      <array-block
        .contentId=${contentId}
        .library=${library}
        .path=${path}
      ></array-block>
    `);
  }

  private static createElementBlock(
    contentId: ContentId,
    library: ModelLibrary,
    path: string
  ): Promise<TemplateResult> {
    return Promise.resolve(html`
      <element-block
        .contentId=${contentId}
        .library=${library}
        .path=${path}
      ></element-block>
    `);
  }

  private static createGroupBlock(
    contentId: ContentId,
    library: ModelLibrary,
    path: string
  ): Promise<TemplateResult> {
    return Promise.resolve(html`
      <group-block
        .contentId=${contentId}
        .library=${library}
        .path=${path}
      ></group-block>
    `);
  }
}