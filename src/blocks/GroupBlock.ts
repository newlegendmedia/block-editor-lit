import { html, css, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { until } from 'lit/directives/until.js';
import { repeat } from 'lit/directives/repeat.js';
import { IndexedCompositeBlock } from './IndexedCompositeBlock';
import { BlockFactory } from './BlockFactory';
import { GroupModel, Model } from '../model/model';
import { ContentId, CompositeContent } from '../content/content';

@customElement('group-block')
export class GroupBlock extends IndexedCompositeBlock {
	@state() private showSlashMenu: boolean = false;

	static styles = [
		css`
			.group-content {
				display: flex;
				flex-direction: column;
				gap: var(--spacing-medium);
			}
			.group-item {
				display: flex;
				align-items: flex-start;
				gap: var(--spacing-medium);
			}
			.item-container {
				flex: 1;
			}
			.mirror-container {
				flex: 1;
				border-left: 2px dashed var(--border-color);
				padding-left: var(--spacing-medium);
			}
			.remove-button {
				margin-left: var(--spacing-small);
			}
			.slash-menu {
				margin-top: var(--spacing-small);
			}
		`,
	];

	private renderChildComponent(
		childComponentPromise: Promise<TemplateResult>,
		placeholder: string
	): TemplateResult {
		return html` ${until(childComponentPromise, html`<span>${placeholder}</span>`)} `;
	}

	protected renderContent(): TemplateResult {
		if (!this.content || !this.model) {
			return html`<div>Group Loading...</div>`;
		}

		const model = this.model as GroupModel;
		const children = (this.content as CompositeContent).children || [];

		return html`
			<div>
				<h3>${model.name || 'Group'}</h3>
				<div class="group-content">
					${repeat(
						children,
						(childId) => childId,
						(_childId, index) => html`
							<div class="group-item">
								${this.renderChildComponent(
									BlockFactory.createComponent(this.path, children[index], 'element'),
									'Loading child component...'
								)}
								<button class="remove-button" @click=${() => this.removeChildBlock(index)}>
									Remove
								</button>
							</div>
						`
					)}
				</div>
				${this.renderAddButton()} ${this.showSlashMenu ? this.renderSlashMenu() : ''}
			</div>
		`;
	}

	private renderAddButton(): TemplateResult {
		return html`<button @click=${this.toggleSlashMenu}>Add Item</button>`;
	}

	private renderSlashMenu(): TemplateResult {
		const model = this.model as GroupModel;
		return html`
			<div class="slash-menu">
				${model.itemTypes
					? (model.itemTypes as Model[]).map(
							(itemType) =>
								html`<button @click=${() => this.addChildBlock(itemType)}>
									${itemType.name || itemType.key}
								</button>`
						)
					: html`<span>Loading item types...</span>`}
			</div>
		`;
	}

	private toggleSlashMenu() {
		this.showSlashMenu = !this.showSlashMenu;
	}

	protected async addChildBlock(itemType: Model): Promise<ContentId> {
		this.showSlashMenu = false;
		return await super.addChildBlock(itemType);
	}
}
