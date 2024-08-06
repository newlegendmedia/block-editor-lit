import { ReactiveController, ReactiveControllerHost, html, TemplateResult } from 'lit';
import { Property } from '../types/ModelDefinition';
import { TreeStateController } from '../controllers/TreeStateController';
import { ModelStateController } from '../controllers/ModelStateController';

export abstract class BaseBlock implements ReactiveController {
	protected host: ReactiveControllerHost;

	constructor(
		public modelProperty: Property,
		public path: string,
		public treeStateController: TreeStateController,
		public modelStateController: ModelStateController
	) {
		this.host = treeStateController.host;
		this.host.addController(this);
	}

	abstract render(): TemplateResult;

	getContent(): any {
		return this.treeStateController.getContentByPath(this.path);
	}

	setContent(content: any): void {
		this.treeStateController.setContentByPath(this.path, content);
	}

	addChild(_child: BaseBlock): void {
		// Implementation depends on the specific block type
	}

	removeChild(_child: BaseBlock): void {
		// Implementation depends on the specific block type
	}

	getChildren(): BaseBlock[] {
		const childProperties = this.modelStateController.getAllowedChildTypes(this.path);
		const children = childProperties
			.map((childProp) => {
				const childPath = this.path ? `${this.path}.${childProp.key}` : childProp.key;
				return this.treeStateController.getBlock(childPath);
			})
			.filter((block): block is BaseBlock => block !== undefined);

		return children;
	}

	update(_changedProperties: Map<string, any>): void {
		// Default update logic
	}

	// Implement other ReactiveController methods
	hostConnected(): void {}
	hostDisconnected(): void {}
	hostUpdate(): void {}
	hostUpdated(): void {}
}

export class ElementBlock extends BaseBlock {
	render(): TemplateResult {
		const content = this.getContent();
		return html`
			<div class="element-block">
				<label>${this.modelProperty.label || this.modelProperty.key}</label>
				<input type="text" .value=${content || ''} @input=${this.handleInput} />
			</div>
		`;
	}

	private handleInput(e: Event) {
		const input = e.target as HTMLInputElement;
		this.setContent(input.value);
	}
}

export class ModelBlock extends BaseBlock {
	render(): TemplateResult {
		const children = this.getChildren();

		return html`
			<div class="model-block">
				<h3>${this.modelProperty.label || this.modelProperty.key}</h3>
				${children.map((child) => {
					return child.render();
				})}
			</div>
		`;
	}
}

export class ListBlock extends BaseBlock {
	render(): TemplateResult {
		const items = this.getContent() || [];

		return html`
			<div class="list-block">
				<h3>${this.modelProperty.label || this.modelProperty.key}</h3>
				<ul>
					${items.map(
						(item: any, index: number) => html` <li>${this.renderListItem(item, index)}</li> `
					)}
				</ul>
				<button @click=${this.handleAddItem}>Add Item</button>
			</div>
		`;
	}

	private renderListItem(item: any, index: number): TemplateResult {
		const itemPath = `${this.path}[${index}]`;
		const itemBlock = this.treeStateController.getBlock(itemPath);
		if (itemBlock) {
			return itemBlock.render();
		} else {
			console.warn(`No block found for list item at path: ${itemPath}`);
			return html`${JSON.stringify(item)}`;
		}
	}

	private handleAddItem() {
		const listProperty = this.modelProperty as Property & { items: Property };
		this.treeStateController.addChildBlock(this.path, listProperty.items);
	}
}

export class GroupBlock extends BaseBlock {
	render(): TemplateResult {
		const children = this.getChildren();

		return html`
			<div class="group-block">
				<h3>${this.modelProperty.label || this.modelProperty.key}</h3>
				${children.map((child) => child.render())}
			</div>
		`;
	}
}
