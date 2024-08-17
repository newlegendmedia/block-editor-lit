import { LitElement, html, css, CSSResultGroup, PropertyValues, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import type { Property } from '../util/model';
import { globalDebugState } from '../util/debugState';
import { libraryStore, type UnifiedLibrary } from '../library/libraryStore';

export class BaseBlock extends LitElement {
	@property({ type: Object }) model!: Property;
	@property({ type: Object }) data: any;
	@state() protected error: string | null = null;
	@state() private showDebugButtons: boolean = false;
	@state() protected library: UnifiedLibrary | null = null;
	@state() protected libraryReady: boolean = false;
	@state() private showDebugInfo: boolean = false;

	private debugStateListener: () => void;
	private unsubscribeLibrary: (() => void) | null = null;

	static styles = css`
		:host {
			--debug-bg-color: #f4f7f9;
			--debug-border-color: #dae0e3;
			--debug-text-color: #212529;
			--debug-highlight-color: #e9ecef;
		}

		:host {
			display: block;
			margin-bottom: var(--spacing-medium);
			border: 1px solid var(--border-color);
			padding: var(--spacing-medium);
			border-radius: var(--border-radius);
		}

		.debug-info {
			background-color: var(--debug-bg-color);
			border: 1px solid var(--debug-border-color);
			border-radius: 4px;
			color: var(--debug-text-color);
			font-family: 'Courier New', Courier, monospace;
			font-size: 14px;
			line-height: 1.5;
			margin-top: 20px;
			overflow: hidden;
		}

		.debug-info-content {
			display: flex;
			flex-direction: column;
			padding: 16px;
		}

		.debug-info h4 {
			margin: 0 0 16px;
			font-size: 18px;
			font-weight: bold;
		}

		.debug-info-item {
			background-color: var(--debug-highlight-color);
			border-radius: 4px;
			padding: 8px;
			margin-bottom: 16px;
		}

		.debug-info pre {
			background-color: white;
			border: 1px solid var(--debug-border-color);
			border-radius: 4px;
			margin: 0;
			padding: 8px;
			overflow-x: auto;
		}

		.button.secondary-button {
			background-color: var(--secondary-color);
			color: white;
			border: none;
			padding: var(--spacing-small) var(--spacing-medium);
			margin-bottom: var(--spacing-small);
			cursor: pointer;
			border-radius: var(--border-radius);
		}
	` as CSSResultGroup;

	constructor() {
		super();
		this.debugStateListener = () => {
			console.log(`${this.tagName} updating debug state`);
			this.showDebugButtons = globalDebugState.showDebugButtons;
			this.requestUpdate();
		};
	}

	connectedCallback() {
		super.connectedCallback();
		globalDebugState.addListener(this.debugStateListener);
		this.showDebugButtons = globalDebugState.showDebugButtons;
		console.log(`${this.tagName} connected, showDebugButtons: ${this.showDebugButtons}`);

		// Subscribe to the library store
		this.unsubscribeLibrary = libraryStore.subscribe((library) => {
			this.library = library;
			this.libraryReady = true;
			this.requestUpdate();
		});
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		globalDebugState.removeListener(this.debugStateListener);
		console.log(`${this.tagName} disconnected`);

		// Unsubscribe from the library store
		if (this.unsubscribeLibrary) {
			this.unsubscribeLibrary();
		}
	}

	protected updated(changedProperties: PropertyValues) {
		super.updated(changedProperties);
		if (changedProperties.has('showDebugButtons')) {
			console.log(`${this.tagName} showDebugButtons updated to: ${this.showDebugButtons}`);
		}
		if (changedProperties.has('libraryReady') && this.libraryReady) {
			this.onLibraryReady();
		}
	}

	protected onLibraryReady() {
		// Override this method in child classes to perform actions when the library is ready
	}

	render(): TemplateResult {
		return html`
			${this.error ? html`<div class="error">${this.error}</div>` : ''}
			${this.showDebugButtons ? this.renderDebugButton() : ''}
			<div>${this.renderContent()}</div>
			${this.showDebugInfo ? this.renderDebugInfo() : ''}
		`;
	}

	protected renderContent(): TemplateResult {
		return html`<div>${this.model?.name}: ${JSON.stringify(this.data)}</div>`;
	}

	private renderDebugButton(): TemplateResult {
		return html`
			<button class="button secondary-button debug-button" @click=${this.toggleDebug}>
				${this.showDebugInfo ? 'Hide' : 'Show'} Debug Info
			</button>
		`;
	}

	private toggleDebug() {
		this.showDebugInfo = !this.showDebugInfo;
		this.requestUpdate();
	}

	private renderDebugInfo() {
		const debugInfo = {
			model: this.model,
			data: this.data,
			library: this.library ? 'Loaded' : 'Not Loaded',
		};
		return html`
			<div class="debug-info">
				<div class="debug-info-content">
					<h4>Debug Information</h4>
					<div class="debug-info-item">
						Model Type: ${this.model?.type}<br />
						Data Type: ${typeof this.data}<br />
						Library Status: ${this.library ? 'Loaded' : 'Not Loaded'}
					</div>
					<pre>${JSON.stringify(debugInfo, null, 2)}</pre>
				</div>
			</div>
		`;
	}

	protected setError(message: string) {
		this.error = message;
	}

	protected clearError() {
		this.error = null;
	}
}
