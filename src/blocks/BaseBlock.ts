import { LitElement, html, css, CSSResultGroup, PropertyValues, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import type { Property } from '../util/model';
import { libraryStore, type ModelLibrary } from '../library/libraryStore';
import { BlockId, blockStore, ContentBlock } from '../blocks/BlockStore';
import { DebugController, globalDebugState } from '../util/DebugController';

export abstract class BaseBlock extends LitElement {
    @property({ type: String }) blockId: string = '';
    @property({ type: String }) path: string = '';
    @state() protected model?: Property;
    @state() protected block?: ContentBlock;
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
                block: this.block,
                model: this.model,
                path: this.path,
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
        return html`
            ${this.renderDebug()}
            ${this.renderError()}
            ${this.renderPath()}
            <div>${this.renderContent()}</div>
        `;
    }

    protected renderPath(): TemplateResult {
        return html`
            <div class="path-display" @click=${this.handlePathClick}>
                Current Path: ${this.path}
            </div>
        `;
    }

    private handlePathClick(e: Event) {
        e.stopPropagation(); // Prevent event from bubbling up
        this.dispatchEvent(new CustomEvent('path-clicked', {
            detail: { path: this.path },
            bubbles: true,
            composed: true
        }));
    }
    
    protected abstract renderContent(): TemplateResult;

    protected renderDebug(): TemplateResult {
        if (!globalDebugState.useDebugController) {
            return html``;
        }
        return html`${this.debugController.renderDebugButton()} ${this.debugController.renderDebugInfo()}`;
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

    protected getModel(): Property | undefined {
        if (!this.block) {
            console.error(`${this.tagName}: Cannot get model - block is missing`);
            return undefined;
        }

        if (this.block.inlineModel) {
            return this.block.inlineModel;
        }

        if (!this.library) {
            console.error(`${this.tagName}: Cannot get model - library is missing`);
            return undefined;
        }

        const modelKey = this.block.modelRef || this.block.modelKey;
        const model = this.library.getDefinition(modelKey, this.block.type);
        if (!model) {
            console.error(`${this.tagName}: Model not found for key ${modelKey}`);
        }
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