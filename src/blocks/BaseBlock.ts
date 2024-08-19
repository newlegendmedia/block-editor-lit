import { LitElement, html, css, CSSResultGroup, PropertyValues, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import type { Property } from '../util/model';
import { libraryStore, type UnifiedLibrary } from '../library/libraryStore';
import { BlockId, blockStore, ContentBlock } from '../blocks/BlockStore';
import { DebugController, globalDebugState } from '../util/DebugController';

export abstract class BaseBlock extends LitElement {
	//	@property({ type: String }) blockId!: string;
	@state() protected model?: Property;
	@state() protected block?: ContentBlock;
	@state() protected error: string | null = null;
	@state() protected library: UnifiedLibrary;

	private unsubscribeBlock: (() => void) | null = null;
	protected debugController: DebugController;

	private _blockId?: string;

	@property({ type: String })
	get blockId(): string | undefined {
		return this._blockId;
	}

	set blockId(value: string | undefined) {
		console.log(`BlockId setter called: old=${this._blockId}, new=${value}`);
		const oldValue = this._blockId;
		this._blockId = value;
		this.requestUpdate('blockId', oldValue);
	}

	static styles = css`
		:host {
			display: block;
			margin-bottom: var(--spacing-medium);
			border: 1px solid var(--border-color);
			padding: var(--spacing-medium);
			border-radius: var(--border-radius);
		}

		.error {
			color: red;
			margin-bottom: var(--spacing-small);
		}

		.debug-info {
			background-color: var(--debug-bg-color, #f4f7f9);
			border: 1px solid var(--debug-border-color, #dae0e3);
			border-radius: 4px;
			color: var(--debug-text-color, #212529);
			font-family: 'Courier New', Courier, monospace;
			font-size: 14px;
			line-height: 1.5;
			margin-top: 20px;
			padding: 16px;
			overflow: hidden;
		}
	` as CSSResultGroup;

	constructor() {
		super();
		this.library = libraryStore.value;
		this.debugController = new DebugController(this);
	}

	connectedCallback() {
		super.connectedCallback();
		console.log(`Connected: blockId=${this.blockId}`);
		this.subscribeToBlock();
		this.model = this.getModel();
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		if (this.unsubscribeBlock) {
			this.unsubscribeBlock();
		}
	}

	protected updated(changedProperties: PropertyValues) {
		super.updated(changedProperties);
		if (changedProperties.has('blockId')) {
			const oldValue = changedProperties.get('blockId');
			console.log('BlockId changed in updated():', {
				old: oldValue,
				new: this.blockId,
				changed: oldValue !== this.blockId,
			});
			if (this.blockId) {
				this.subscribeToBlock();
//				this.model = this.getModel();
			} else {
				console.warn('BlockId is undefined in updated()');
			}
		}
		if (globalDebugState.useDebugController) {
			this.debugController.setDebugInfo({
				block: this.block,
				model: this.model,
			});
		}
	}

	private subscribeToBlock() {
		if (this.unsubscribeBlock) {
			this.unsubscribeBlock();
		}
		this.unsubscribeBlock = blockStore.subscribeToBlock(this.blockId as BlockId, (block) => {
			this.block = block;
			this.requestUpdate();
		});
	}

	render(): TemplateResult {
		console.log('Rendering block:', this.blockId);
		return html`
			<div>BLOCKID: ${this.blockId}</div>
			${globalDebugState.useDebugController ? this.debugController.renderDebugButton() : ''}
			${globalDebugState.useDebugController ? this.debugController.renderDebugInfo() : ''}
			${this.error ? html`<div class="error">${this.error}</div>` : ''}

			<div>${this.renderContent()}</div>
		`;
	}

	protected abstract renderContent(): TemplateResult;

	protected setError(message: string) {
		this.error = message;
	}

	protected clearError() {
		this.error = null;
	}

	protected getModel(): Property | undefined {
		if (!this.block) {
			console.error(`${this.tagName}: Cannot get model - block is missing`);
			return undefined;
		}

		if (this.block.inlineModel) {
			console.log('Using inline model');
			return this.block.inlineModel;
		}

		if (!this.library) {
			console.error(`${this.tagName}: Cannot get model - library is missing`);
			return undefined;
		}

		const modelKey = this.block.modelRef || this.block.modelKey;
		const model = this.library.getDefinition(modelKey, this.block.type);
		return model;
	}

	protected updateBlockContent(content: any) {
		if (!this.block) return;

		blockStore.updateBlock(this.block.id, (block) => ({
			...block,
			content: content,
		}));

		this.dispatchEvent(
			new CustomEvent('value-changed', {
				detail: { key: this.block.modelKey, value: content },
				bubbles: true,
				composed: true,
			})
		);
	}
}
