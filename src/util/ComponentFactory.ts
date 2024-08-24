import { html, TemplateResult } from 'lit';
import { contentStore } from '../content/ContentStore.ts';
import type { ModelLibrary } from '../model/libraryStore.ts';
import type { Model } from '../model/model.ts';

import '../blocks/BaseBlock.ts';
import '../blocks/ObjectBlock.ts';
import '../blocks/ArrayBlock.ts';
import '../blocks/ElementBlock.ts';
import '../blocks/GroupBlock.ts';
import '../blocks/MirrorBlock.ts';
import '../components/DocumentComponent.ts';

export class ComponentFactory {
  static createComponent(
    contentId: string,
    library: ModelLibrary,
    path: string,
    inlineModel?: Model
  ): TemplateResult {
    if (contentId.startsWith('inline:')) {
      return html`<element-block
        .contentId=${contentId}
        .library=${library}
        .path=${path}
        .inlineModel=${inlineModel}
        .isInline=${true}
      ></element-block>`;
    }

    // Check if it's a mirror block
    if (contentId.startsWith('mirror:')) {
      const originalId = contentId.split(':')[1];
      return html`<mirror-block
        .contentId=${contentId}
        .referencedContentId=${originalId}
        .library=${library}
        .path=${path}
      ></mirror-block>`;
    }

    const block = contentStore.getBlock(contentId);
    if (!block) {
      return html`<div>Error: Block not found</div>`;
    }

    const fullPath = path || block.modelInfo.key;

    switch (block.modelInfo.type) {
      case 'object':
        return html`<object-block
          .contentId=${contentId}
          .library=${library}
          .path=${fullPath}
        ></object-block>`;
      case 'element':
        return html`<element-block
          .contentId=${contentId}
          .library=${library}
          .path=${fullPath}
        ></element-block>`;
      case 'array':
        return html`<array-block
          .contentId=${contentId}
          .library=${library}
          .path=${fullPath}
        ></array-block>`;
      case 'group':
        return html`<group-block
          .contentId=${contentId}
          .library=${library}
          .path=${fullPath}
        ></group-block>`;
      default:
        console.warn(`Unknown block type: ${block.modelInfo.type}`);
        return html`<div>Unknown block type: ${block.modelInfo.type}</div>`;
    }
  }
}