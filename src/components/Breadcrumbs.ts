import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { UniversalPath } from '../path/UniversalPath';

@customElement('h-breadcrumbs')
export class Breadcrumbs extends LitElement {
	@property({ type: Object }) path!: UniversalPath;

	static styles = css`
		:host {
			display: block;
			font-size: 14px;
		}
		.breadcrumbs-container {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			padding: 2px 0;
			background-color: var(--background-color);
			border-radius: var(--border-radius);
		}
		.breadcrumb {
			cursor: pointer;
			color: var(--link-color);
		}
		.breadcrumb:hover {
			text-decoration: underline;
		}
		.separator {
			margin: 0 6px;
			color: var(--secondary-color);
		}
		.current {
			color: var(--link-color-selected);
		}
	`;

	render() {
		const segments = this.path.segments;

		return html`
			<div class="breadcrumbs-container">
				${segments.map((segment, index) => {
					const currentPath = new UniversalPath(this.path.toString());
					currentPath.segments = currentPath.segments.slice(0, index + 1);
					const isLast = index === segments.length - 1;
					const isDocumentId = index === 0;
					const displayText = isDocumentId ? 'document' : segment.contentKey;

					return html`
						${index > 0 ? html`<span class="separator">/</span>` : ''}
						<span
							class=${isLast ? 'current' : 'breadcrumb'}
							@click=${() => this.handleClick(currentPath)}
							>${displayText}</span
						>
					`;
				})}
			</div>
		`;
	}

	private handleClick(path: UniversalPath) {
		this.dispatchEvent(
			new CustomEvent('breadcrumb-clicked', {
				detail: { path: path },
				bubbles: true,
				composed: true,
			})
		);
	}
}
