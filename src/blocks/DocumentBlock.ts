import { ModelBlock } from './BaseBlock';
import { Property } from '../types/ModelDefinition';
import { TreeStateController } from '../controllers/TreeStateController';
import { ModelStateController } from '../controllers/ModelStateController';
import { html, TemplateResult } from 'lit';

export class DocumentBlock extends ModelBlock {
  constructor(
    modelProperty: Property,
    path: string,
    treeStateController: TreeStateController,
    modelStateController: ModelStateController
  ) {
    super(modelProperty, path, treeStateController, modelStateController);
  }

  override render(): TemplateResult {
    console.log(`Rendering DocumentBlock: ${this.path}`);
    const content = this.getContent();
    const childBlocks = this.treeStateController.getChildBlocks(this.path);
    return html`
      <div class="document-block">
        <h1>${content.title || 'Untitled Document'}</h1>
        ${childBlocks.map(childBlock => html`
          <block-component
            .path=${childBlock.path}
            .treeStateController=${this.treeStateController}
            .modelStateController=${this.modelStateController}
          ></block-component>
        `)}
      </div>
    `;
  }
}