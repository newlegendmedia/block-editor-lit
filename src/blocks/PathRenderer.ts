import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ComponentFactory } from '../util/ComponentFactory';
import { blockStore, ContentBlock, CompositeBlock } from '../blocks/BlockStore';
import { libraryStore } from '../library/libraryStore';

@customElement('path-renderer')
export class PathRenderer extends LitElement {
	@property({ type: String }) path: string = '';
	@state() private targetBlockId: string | null = null;

	static styles = css``;

	protected updated(changedProperties: Map<string, any>) {
		if (changedProperties.has('path')) {
			this.findTargetBlock();
		}
	}

	private findTargetBlock() {
		const pathParts = this.path.split('.');

		const document = blockStore.getDocument(pathParts[0]);

		if (!document) {
			this.targetBlockId = null;
			return;
		}

		let currentBlock = blockStore.getBlock(document.rootBlock);

		if (pathParts.length === 1) {
			this.targetBlockId = currentBlock?.id || null;
			return;
		}

		for (let i = 1; i < pathParts.length; i++) {
			if (!currentBlock || !this.isCompositeBlock(currentBlock)) {
				this.targetBlockId = null;
				return;
			}
			const childBlock = currentBlock.children.find((childId) => {
				const child = blockStore.getBlock(childId);
				return child && child.modelKey === pathParts[i];
			});
			if (!childBlock) {
				this.targetBlockId = null;
				return;
			}
			currentBlock = blockStore.getBlock(childBlock);
		}

		this.targetBlockId = currentBlock?.id || null;
	}

	private isCompositeBlock(block: ContentBlock): block is CompositeBlock {
		return 'children' in block && Array.isArray((block as CompositeBlock).children);
	}

	render() {
		if (!this.targetBlockId) {
			return html` <div>Block not found at path: ${this.path}</div> `;
		}

		return html`
			<div>
				${ComponentFactory.createComponent(this.targetBlockId, libraryStore.value, this.path)}
			</div>
		`;
	}
}
