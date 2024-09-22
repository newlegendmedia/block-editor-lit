import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ContentPath } from '../content/ContentPath';

@customElement('h-breadcrumbs')
export class Breadcrumbs extends LitElement {
	@property({ type: Object }) path!: ContentPath;

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
		const segments = this.path.pathSegments;

		return html`
			<div class="breadcrumbs-container">
				${segments.map((segment, index) => {
					const currentPath = this.path.getSubPath(index);
					const isLast = index === segments.length - 1;
					const isDocumentId = index === 0;
					const displayText = isDocumentId ? 'document' : this.path.serializeSegment(segment);

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

	private handleClick(path: string) {
		this.dispatchEvent(
			new CustomEvent('breadcrumb-clicked', {
				detail: { path },
				bubbles: true,
				composed: true,
			})
		);
	}
}
