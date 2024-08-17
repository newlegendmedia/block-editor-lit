import { html, TemplateResult } from 'lit';
import { blockStore } from '../blocks/BlockStore';
import type { UnifiedLibrary } from '../library/libraryStore';

import '../blocks/BaseBlock.ts';
import '../blocks/ObjectBlock.ts';
import '../blocks/ArrayBlock.ts';
import '../blocks/ElementBlock.ts';
import '../blocks/GroupBlock.ts';
import '../blocks/DocumentBlock.ts';

export class ComponentFactory {
	static createComponent(blockId: string, library: UnifiedLibrary): TemplateResult {
		const block = blockStore.getBlock(blockId);
		if (!block) {
			return html`<div>Error: Block not found</div>`;
		}

		switch (block.type) {
			case 'object':
				return html`<object-component .blockId=${blockId} .library=${library}></object-component>`;
			case 'element':
				return html`<element-component
					.blockId=${blockId}
					.library=${library}
				></element-component>`;
			case 'array':
				return html`<array-component .blockId=${blockId} .library=${library}></array-component>`;
			case 'group':
				return html`<group-component .blockId=${blockId} .library=${library}></group-component>`;
			default:
				console.warn(`Unknown block type: ${block.type}`);
				return html`<div>Unknown block type: ${block.type}</div>`;
		}
	}
}
