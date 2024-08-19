import { html, TemplateResult } from 'lit';
import { blockStore } from '../blocks/BlockStore';
import type { ModelLibrary } from '../library/libraryStore';

import '../blocks/BaseBlock.ts';
import '../blocks/ObjectBlock.ts';
import '../blocks/ArrayBlock.ts';
import '../blocks/ElementBlock.ts';
import '../blocks/GroupBlock.ts';
import '../blocks/DocumentBlock.ts';

export class ComponentFactory {
    static createComponent(blockId: string, library: ModelLibrary, parentPath: string = ''): TemplateResult {
        const block = blockStore.getBlock(blockId);
        if (!block) {
            return html`<div>Error: Block not found</div>`;
        }

        const fullPath = parentPath || block.modelKey;

        const commonProps = {
            blockId: blockId,
            library: library,
            path: fullPath,
        };

        switch (block.type) {
            case 'object':
                return html`<object-component .blockId=${blockId} .library=${library} .path=${fullPath}></object-component>`;
            case 'element':
                return html`<element-component .blockId=${blockId} .library=${library} .path=${fullPath}></element-component>`;
            case 'array':
                return html`<array-component .blockId=${blockId} .library=${library} .path=${fullPath}></array-component>`;
            case 'group':
                return html`<group-component .blockId=${blockId} .library=${library} .path=${fullPath}></group-component>`;
            default:
                console.warn(`Unknown block type: ${block.type}`);
                return html`<div>Unknown block type: ${block.type}</div>`;
        }
    }
}