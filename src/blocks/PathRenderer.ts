import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ComponentFactory } from '../util/ComponentFactory';
import { blockStore, ContentBlock, CompositeBlock } from '../blocks/BlockStore';
import { libraryStore } from '../library/libraryStore';

@customElement('path-renderer')
export class PathRenderer extends LitElement {
	@state() private targetBlockId: string | null = null;
	private _path: string = '';

	@property({ type: String })
	get path(): string {
		return this._path;
	}

	set path(value: string) {
		const oldValue = this._path;
		this._path = value;
		this.requestUpdate('path', oldValue);
		this.findTargetBlock();
	}

	static styles = css``;

	private findTargetBlock() {
		console.log(`Processing path: ${this._path}`);
		const pathParts = this._path.split('.');

		const document = blockStore.getDocument(pathParts[0]);
		console.log(`Document found:`, document);

		if (!document) {
			console.error(`Document not found: ${pathParts[0]}`);
			this.targetBlockId = null;
			return;
		}

		let currentBlock = blockStore.getBlock(document.rootBlock);
		console.log(`Root block:`, currentBlock);

		if (!currentBlock) {
			console.error(`Root block not found for document: ${pathParts[0]}`);
			this.targetBlockId = null;
			return;
		}

		if (pathParts.length === 1) {
			this.targetBlockId = currentBlock.id;
			return;
		}

		for (let i = 1; i < pathParts.length; i++) {
			if (!this.isCompositeBlock(currentBlock)) {
				console.error(`Non-composite block encountered: ${currentBlock.id}`);
				this.targetBlockId = null;
				return;
			}

			const childKey = pathParts[i];
			console.log(`Looking for child with key: ${childKey}`);
			console.log(`Current block children:`, currentBlock.children);
			console.log(`Current block childrenType:`, currentBlock.childrenType);

			let childBlockId: string | undefined;

			if (!currentBlock.childrenType) {
				if (currentBlock.type === 'group') {
					currentBlock.childrenType = 'indexed';
				} else if (currentBlock.type === 'object') {
					currentBlock.childrenType = 'keyed';
				} else if (currentBlock.type === 'array') {
					currentBlock.childrenType = 'indexed';
				} else {
					console.error(`Invalid Block Type for Composites: ${currentBlock.type}`);
					this.targetBlockId = null;
					return;
				}
			}

			// Default to keyed lookup if childrenType is undefined
			if (currentBlock.childrenType !== 'indexed') {
				childBlockId = currentBlock.children.find((childId) => {
					const child = blockStore.getBlock(childId);
					console.log(`1 - Checking child:`, child);
					return child && (child.modelKey === childKey || child.id === childKey);
				});
			} else {
				const index = parseInt(childKey, 10);
				console.log(`2 - Parsed index: ${index}`, currentBlock.children);
				if (!isNaN(index) && index >= 0 && index < currentBlock.children.length) {
					childBlockId = currentBlock.children[index];
				}
			}

			if (!childBlockId) {
				console.error(`Child block not found for key: ${childKey}`);
				this.targetBlockId = null;
				return;
			}

			currentBlock = blockStore.getBlock(childBlockId);
			if (!currentBlock) {
				console.error(`Block not found for id: ${childBlockId}`);
				this.targetBlockId = null;
				return;
			}

			console.log(`Found child block:`, currentBlock);
		}

		this.targetBlockId = currentBlock.id;
		console.log(`Final target block ID: ${this.targetBlockId}`);
	}

	private isCompositeBlock(block: ContentBlock): block is CompositeBlock {
		return 'children' in block && Array.isArray((block as CompositeBlock).children);
	}

	render() {
		if (!this.targetBlockId) {
			return html` <div>Block not found at path: ${this._path}</div> `;
		}

		return html`
			<div>
				${ComponentFactory.createComponent(this.targetBlockId, libraryStore.value, this._path)}
			</div>
		`;
	}
}