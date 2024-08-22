import { html, TemplateResult } from 'lit';
import { contentStore } from '../content/ContentStore.ts';
import type { ModelLibrary } from '../model/libraryStore.ts';

import '../blocks/BaseBlock.ts';
import '../blocks/ObjectBlock.ts';
import '../blocks/ArrayBlock.ts';
import '../blocks/ElementBlock.ts';
import '../blocks/GroupBlock.ts';
import '../components/DocumentComponent.ts';

export class ComponentFactory {
    static createComponent(contentId: string, library: ModelLibrary, parentPath: string = ''): TemplateResult {
        const block = contentStore.getBlock(contentId);
        if (!block) {
            return html`<div>Error: Block not found</div>`;
        }

        const fullPath = parentPath || block.modelInfo.key;

        switch (block.modelInfo.type) {
            case 'object':
                return html`<object-block .contentId=${contentId} .library=${library} .path=${fullPath}></object-block>`;
            case 'element':
                return html`<element-block .contentId=${contentId} .library=${library} .path=${fullPath}></element-block>`;
            case 'array':
                return html`<array-block .contentId=${contentId} .library=${library} .path=${fullPath}></array-block>`;
            case 'group':
                return html`<group-block .contentId=${contentId} .library=${library} .path=${fullPath}></group-block>`;
            default:
                console.warn(`Unknown block type: ${block.modelInfo.type}`);
                return html`<div>Unknown block type: ${block.modelInfo.type}</div>`;
        }
    }
}