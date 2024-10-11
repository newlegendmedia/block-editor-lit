import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

@customElement('json-viewer')
export class JsonViewer extends LitElement {
	@property({ type: Object }) data: any = {};
	@property({ type: Object }) private expandedKeys: Set<string> = new Set();

	static styles = css`
		:host {
			font-family: Arial, sans-serif;
			font-size: 14px;
			color: #555;
			display: block;
		}
		.viewer {
			background-color: #bbb;
			color: #333;
			padding: 8px;
			border-radius: 4px;
			font-size: 14px;
		}
		.object,
		.array {
			margin-left: 16px;
			border-left: 1px dashed #ccc;
			padding-left: 8px;
		}
		.key {
			color: #a71d5d;
			cursor: pointer;
			user-select: none;
		}
		.toggle {
			cursor: pointer;
			margin-right: 4px;
			user-select: none;
		}
		.string {
			color: #183691;
		}
		.number {
			color: #0086b3;
		}
		.boolean {
			color: #795da3;
		}
		.null {
			color: #999;
			font-style: italic;
		}
		.special {
			color: #e45649;
		}
		.toggle-icon {
			display: inline-block;
			width: 12px;
			text-align: center;
		}
	`;

	render(): TemplateResult {
		return html`<div class="viewer">${this.renderValue(this.data)}</div>`;
	}

	renderValue(value: any, key?: string): TemplateResult {
		const type = this.getType(value);

		switch (type) {
			case 'object':
			case 'array':
				return this.renderComplex(value, type, key);
			default:
				return this.renderPrimitive(value, type, key);
		}
	}

	renderComplex(value: any, type: 'object' | 'array', key?: string): TemplateResult {
		const entries = this.getEntriesForComplex(value, type);
		const isExpandable = entries.length > 0;
		//        const isExpanded = key ? this.expandedKeys.has(key) : this.expandedKeys.has('root');
		let isExpanded = true;

		return html`
			<div>
				${key ? html`<span class="key">${key}:</span>` : ''}
				${isExpandable
					? html` <span
								class="toggle"
								@click=${() => this.toggleExpand(key || 'root')}
								title="Toggle Expand/Collapse"
							>
								<span class="toggle-icon">${isExpanded ? '▼' : '▶'}</span>
							</span>
							${type === 'object' ? `{${value.constructor.name}}` : `[Array(${entries.length})]`}
							${isExpanded
								? html`
										<div class="${type}">
											${repeat(
												entries,
												([k, _]) => k,
												([k, v]) => this.renderValue(v, String(k))
											)}
										</div>
									`
								: ''}`
					: html`${type === 'object' ? '{ }' : '[ ]'}`}
			</div>
		`;
	}

	renderPrimitive(value: any, type: string, key?: string): TemplateResult {
		let formattedValue = this.formatValue(value, type);
		return html`
			<div>
				${key ? html`<span class="key">${key}:</span>` : ''}
				<span class="${type}">${formattedValue}</span>
			</div>
		`;
	}

	formatValue(value: any, type: string): string {
		switch (type) {
			case 'string':
				return `"${value}"`;
			case 'null':
				return 'null';
			case 'function':
				return '[Function]';
			default:
				return String(value);
		}
	}

	getType(value: any): string {
		if (value === null) return 'null';
		if (Array.isArray(value)) return 'array';
		if (typeof value === 'function') return 'function';
		if (typeof value === 'object') return 'object';
		return typeof value;
	}

	getEntriesForComplex(value: any, type: 'object' | 'array'): [string, any][] {
		if (type === 'array') {
			return Array.from(value.entries());
		}

		// For objects, including special objects
		return Object.entries(this.getEnumerableProperties(value));
	}

	getEnumerableProperties(obj: any): Record<string, any> {
		const props: Record<string, any> = {};
		for (const key in obj) {
			if (typeof obj[key] !== 'function') {
				props[key] = obj[key];
			}
		}
		return props;
	}

	toggleExpand(key: string): void {
		const newExpandedKeys = new Set(this.expandedKeys);
		if (newExpandedKeys.has(key)) {
			newExpandedKeys.delete(key);
		} else {
			newExpandedKeys.add(key);
		}
		this.expandedKeys = newExpandedKeys;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'json-viewer': JsonViewer;
	}
}
