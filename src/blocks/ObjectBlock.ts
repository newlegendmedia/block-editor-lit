import { html, css, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { KeyedCompositeBlock } from './KeyedCompositeBlock';
import { ObjectModel, Model } from '../model/model';

@customElement('object-block')
export class ObjectBlock extends KeyedCompositeBlock {
	@state() private isInitialized: boolean = false;

	static styles = [
		...KeyedCompositeBlock.styles, // Spread the KeyedCompositeBlock styles
		css`
			.object-content {
				display: flex;
				flex-direction: column;
				gap: var(--spacing-small);
			}
			.property-content {
				flex: 1;
			}
			.property-item {
				display: flex;
				align-items: flex-start;
				gap: var(--spacing-small);
				margin-top: var(--spacing-small);
			}
			.property-label {
				font-weight: bold;
				font-size: 14px;
				width: 90px;
				margin-top: 6px;
			}
			label {
				font-size: 13px;
			}
		`,
	];

	protected getModelProperties(): Model[] {
		return (this.model as ObjectModel)?.properties || [];
	}

	protected async initializeBlock() {
		await super.initializeBlock();
		await this.initializeChildComponents();
		this.isInitialized = true;
		this.requestUpdate();
	}

	private async initializeChildComponents() {
		const objectModel = this.model as ObjectModel;

		const componentPromises = objectModel.properties.map(async (prop) => {
			if (!prop.key) return;
			const childKey = prop.key;
			const childComponent = await this.createChildComponent(prop);
			this.childComponents.set(childKey, Promise.resolve(childComponent));
		});

		await Promise.all(componentPromises);
	}

	protected getBlockTitle(): string {
		return (this.model as ObjectModel).name || 'Object';
	}

	protected renderAddButton(): TemplateResult {
		return html`<button @click=${this.toggleAddMenu}>Add Property</button>`;
	}

	protected renderAddMenu(): TemplateResult {
		const objectModel = this.model as ObjectModel;
		const availableProperties = objectModel.properties.filter(
			(prop) => !this.getChildReferences()[prop.key]
		);

		return html`
			<div class="add-menu">
				${availableProperties.map(
					(prop) => html`
						<button @click=${() => this.handleAdd(prop)}>${prop.name || prop.key}</button>
					`
				)}
			</div>
		`;
	}

	// render(): TemplateResult<1> {
	// 	super.render();
	// 	if (!this.isInitialized) {
	// 		return html`<div>Initializing object...</div>`;
	// 	}
	// 	return this.renderContent();
	// }
}
