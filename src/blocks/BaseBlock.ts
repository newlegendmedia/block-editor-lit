import { LitElement, html, css, CSSResultGroup, PropertyValues, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import type { Model } from '../model/model';
import { libraryStore, type ModelLibrary } from '../model/libraryStore';
import { contentStore } from '../content/ContentStore';
import { ContentId, Content } from '../content/content';
import { DebugController, globalDebugState } from '../util/DebugController';

export abstract class BaseBlock extends LitElement {
	@property({ type: String }) contentId: string = '';
	@property({ type: String }) path: string = '';
	@property({ type: Object }) inlineModel?: Model; // New property for inline elements
	@state() protected model?: Model;
	@state() protected content?: Content;
	@state() protected error: string | null = null;
	@state() protected library: ModelLibrary;

	private unsubscribeBlock: (() => void) | null = null;
	protected debugController: DebugController;

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

		.path-display {
			font-size: 0.8em;
			margin-bottom: 10px;
			padding: var(--spacing-small);
			border: 1px solid var(--border-color);
			border-radius: var(--border-radius);
			background-color: var(--background-color);
			color: var(--text-color);
			cursor: pointer;
			transition: background-color 0.3s;
			display: inline-block;
		}

		.path-display:hover {
			background-color: #e0e0e0;
		}
	` as CSSResultGroup;

	constructor() {
		super();
		this.library = libraryStore.value;
		this.debugController = new DebugController(this);
	}

	connectedCallback() {
		super.connectedCallback();
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
		if (globalDebugState.useDebugController) {
			this.debugController.setDebugInfo({
				content: this.content,
				model: this.model,
				path: this.path,
			});
		}
	}

	private subscribeToBlock() {
		if (this.unsubscribeBlock) {
			this.unsubscribeBlock();
		}
		this.unsubscribeBlock = contentStore.subscribeToBlock(
			this.contentId as ContentId,
			(content) => {
				this.content = content;
				this.requestUpdate();
			}
		);
	}

	render(): TemplateResult {
		return html`
			${this.renderDebug()} ${this.renderError()} ${this.renderPath()}
			<div>${this.renderContent()}</div>
		`;
	}

	protected renderPath(): TemplateResult {
		return html`
			<div class="path-display" @click=${this.handlePathClick}>Current Path: ${this.path}</div>
		`;
	}

	private handlePathClick(e: Event) {
		e.stopPropagation(); // Prevent event from bubbling up
		this.dispatchEvent(
			new CustomEvent('path-clicked', {
				detail: { path: this.path },
				bubbles: true,
				composed: true,
			})
		);
	}

	protected abstract renderContent(): TemplateResult;

	protected renderDebug(): TemplateResult {
		if (!globalDebugState.useDebugController) {
			return html``;
		}
		return html`${this.debugController.renderDebugButton()}
		${this.debugController.renderDebugInfo()}`;
	}

	protected renderError(): TemplateResult {
		if (!this.error) {
			return html``;
		}
		return html`<div class="error">${this.error}</div>`;
	}

	protected setError(message: string) {
		this.error = message;
	}

	protected clearError() {
		this.error = null;
	}

	protected getModel(): Model | undefined {
		if (this.inlineModel) {
		  return this.inlineModel;
		}
	
		if (!this.content) {
		  console.error(`${this.tagName}: Cannot get model - content is missing`);
		  return undefined;
		}
	
		const { modelInfo, modelDefinition } = this.content;
	
		if (modelDefinition) {
		  return modelDefinition;
		}
	
		if (!modelInfo.ref) {
		  console.error(`${this.tagName}: Cannot get model - modelRef is missing`);
		  return undefined;
		}
	
		const library = libraryStore.value;
		if (!library) {
		  console.error(`${this.tagName}: Cannot get model - library is missing`);
		  return undefined;
		}
	
		const model = library.getDefinition(modelInfo.ref, modelInfo.type);
		if (!model) {
		  console.error(`${this.tagName}: Model not found for key ${modelInfo.ref}`);
		}
		return model;
	}
	

	protected updateBlockContent(newContent: any) {
		if (!this.content) return;

		contentStore.updateBlock(this.content.id, (block) => ({
			...block,
			content: newContent, // Directly update the content without nesting
		}));

		this.dispatchEvent(
			new CustomEvent('value-changed', {
				detail: { key: this.content.modelInfo.key, value: newContent },
				bubbles: true,
				composed: true,
			})
		);
	}

	// protected updateBlockContent(newContent: any, modelInfo?: any) {
	// 	if (!this.content) return;
	  
	// 	contentStore.updateBlock(this.content.id, (block) => ({
	// 	  ...block,
	// 	  content: {
	// 		value: newContent,
	// 		modelInfo: modelInfo || block.content.modelInfo,
	// 	  },
	// 	}));
	//   }
	  
}
