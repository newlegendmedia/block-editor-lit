import { css, html, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { BaseBlock } from './BaseBlock';
import { ComponentFactory } from '../util/ComponentFactory';
import type { ArrayProperty } from '../util/model';
import { blockStore, CompositeBlock } from '../blocks/BlockStore';

@customElement('array-component')
export class ArrayBlock extends BaseBlock {
  @state() private childBlockIds: string[] = [];

  static styles = [
    BaseBlock.styles,
    css`
      .array-content {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-small);
      }
      .array-item {
        display: flex;
        align-items: center;
      }
      .remove-button {
        margin-left: var(--spacing-small);
      }
    `
  ];

  protected onLibraryReady() {
    super.onLibraryReady();
    this.initializeChildBlocks();
  }

  private initializeChildBlocks() {
    if (!this.block || !this.library) return;

    const arrayModel = this.getModel() as ArrayProperty;
    if (!arrayModel || arrayModel.type !== 'array') return;

    const compositeBlock = this.block as CompositeBlock;
    if (!compositeBlock.children) {
      compositeBlock.children = [];
    }

    this.childBlockIds = compositeBlock.children;

    blockStore.setBlock(compositeBlock);
  }

  protected renderContent(): TemplateResult {
    if (!this.block || !this.library) {
      return html`<div>Loading...</div>`;
    }

    const arrayModel = this.getModel() as ArrayProperty;
    if (!arrayModel || arrayModel.type !== 'array') {
      return html`<div>Invalid array model</div>`;
    }

    return html`
      <div>
        <h3>${arrayModel.name || 'Array'}</h3>
        <div class="array-content">
          ${repeat(
            this.childBlockIds,
            (childId) => childId,
            (childId, index) => html`
              <div class="array-item">
                ${ComponentFactory.createComponent(childId, this.library!)}
                ${arrayModel.repeatable
                  ? html`<button class="remove-button" @click=${() => this.removeItem(index)}>Remove</button>`
                  : ''}
              </div>
            `
          )}
        </div>
        ${arrayModel.repeatable
          ? html`<button @click=${this.addItem}>Add ${arrayModel.itemType.name || 'Item'}</button>`
          : ''}
      </div>
    `;
  }

  private addItem() {
    const arrayModel = this.getModel() as ArrayProperty;
    if (!arrayModel || arrayModel.type !== 'array') return;

    const newChildBlock = blockStore.createBlockFromModel(arrayModel.itemType);
    this.childBlockIds = [...this.childBlockIds, newChildBlock.id];

    const compositeBlock = this.block as CompositeBlock;
    compositeBlock.children = this.childBlockIds;
    blockStore.setBlock(compositeBlock);

    this.requestUpdate();
  }

  private removeItem(index: number) {
    const removedBlockId = this.childBlockIds[index];
    this.childBlockIds = this.childBlockIds.filter((_, i) => i !== index);

    const compositeBlock = this.block as CompositeBlock;
    compositeBlock.children = this.childBlockIds;
    blockStore.setBlock(compositeBlock);

    blockStore.deleteBlock(removedBlockId);

    this.requestUpdate();
  }

  protected handleValueChanged(e: CustomEvent) {
    const { key, value } = e.detail;
    const index = this.childBlockIds.indexOf(key);
    if (index !== -1) {
      const updatedContent = [...(this.block!.content as any[])];
      updatedContent[index] = value;
      this.updateBlockContent(updatedContent);
    }
  }
}