import { css, html, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { BaseBlock } from './BaseBlock';
import { ComponentFactory } from '../util/ComponentFactory';
import type { ObjectProperty, Property } from '../util/model';
import { blockStore, CompositeBlock } from '../blocks/BlockStore';

@customElement('object-component')
export class ObjectBlock extends BaseBlock {
	@state() private childBlocks: { [key: string]: string } = {};

	static styles = [
		BaseBlock.styles,
		css`
			.object-content {
				display: flex;
				flex-direction: column;
				gap: var(--spacing-small);
			}
		`,
	];

	connectedCallback() {
		super.connectedCallback();
		this.initializeChildBlocks();
	}

	private initializeChildBlocks() {
		if (!this.block) return;
	
		const objectModel = this.model as ObjectProperty;
		if (!objectModel || objectModel.type !== 'object') return;
	
		const compositeBlock = this.block as CompositeBlock;
		if (!compositeBlock.children) {
			compositeBlock.children = [];
		}

		objectModel.properties.forEach((prop) => {
			let childBlockId = compositeBlock.children.find(
				(childId) => blockStore.getBlock(childId)?.modelKey === prop.key
			);

			if (!childBlockId) {
				const childBlock = blockStore.createBlockFromModel(prop);
				childBlockId = childBlock.id;
				compositeBlock.children.push(childBlockId);
			}

			this.childBlocks[prop.key!] = childBlockId;
		});

		blockStore.setBlock(compositeBlock);
	}

	protected renderContent(): TemplateResult {
		if (!this.block || !this.library) {
			return html`<div>Loading...</div>`;
		}

		const objectModel = this.getModel() as ObjectProperty;
		if (!objectModel || objectModel.type !== 'object') {
			return html`<div>Invalid object model</div>`;
		}

		return html`
			<div>
				<h2>${objectModel.name || 'Object'}</h2>
				<div class="object-content">
					${repeat(
						objectModel.properties,
						(prop) => prop.key!,
						(prop) => this.renderProperty(prop)
					)}
				</div>
			</div>
		`;
	}

	private renderProperty(prop: Property): TemplateResult {
		const childBlockId = this.childBlocks[prop.key!];
		if (!childBlockId) {
			return html`<div>Error: Child block not found for ${prop.key}</div>`;
		}
		console.log('Rendering property:', childBlockId, prop.key);
		return ComponentFactory.createComponent(childBlockId, this.library!);
	}

	protected handleValueChanged(e: CustomEvent) {
		const { key, value } = e.detail;
		if (!this.block) return;
	
		const updatedContent = { ...this.block.content, [key]: value };
		this.updateBlockContent(updatedContent);
	  }
}
