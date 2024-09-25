import { LitElement, html, css, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Model } from '../../model/model';

@customElement('add-item-menu')
export class AddItemMenu extends LitElement {
	@property({ type: Array }) itemTypes: Model[] = [];
	@property({ type: String }) blockTitle: string = '';
	@state() private showMenu: boolean = false;

	static styles = css`
		.add-button {
			margin-top: 10px;
		}
		.menu {
			margin-top: 5px;
		}
	`;

	render() {
		return html`
			<div>
				<button class="add-button" @click=${this.toggleMenu}>Add ${this.blockTitle}</button>
				${this.showMenu ? this.renderMenu() : ''}
			</div>
		`;
	}

	private renderMenu(): TemplateResult {
		return html`
			<div class="menu">
				${this.itemTypes.map(
					(itemType) => html`
						<button @click=${() => this.handleAdd(itemType)}>
							${itemType.name || itemType.key}
						</button>
					`
				)}
			</div>
		`;
	}

	private toggleMenu() {
		this.showMenu = !this.showMenu;
	}

	private handleAdd(itemType: Model) {
		this.dispatchEvent(
			new CustomEvent('add-item', {
				detail: { itemType },
				bubbles: true,
				composed: true,
			})
		);
		this.showMenu = false;
	}
}
