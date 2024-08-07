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

  renderContent(): TemplateResult {
    return html`
      <div class="document-block">
        <h1>Document Editor</h1>
      </div>
    `;
  }

  // The logDocumentStructure method is kept here but not rendered in the template
  logDocumentStructure() {
    console.log('=== Document Structure ===');
    this.logModelTree();
    this.logContentTree();
  }

  private logModelTree() {
    console.log('--- Model Tree ---');
    this.logModelTreeRecursive();
  }

  private logModelTreeRecursive(path: string = '', depth: number = 0) {
    const property = this.modelStateController.getModelPropertyByPath(path);
    if (!property) return;

    const indent = '  '.repeat(depth);
    console.log(`${indent}${property.key} (${property.type})`);

    if (property.type === 'model' || property.type === 'group') {
      property.properties?.forEach(childProp => {
        const childPath = path ? `${path}.${childProp.key}` : childProp.key;
        this.logModelTreeRecursive(childPath, depth + 1);
      });
    } else if (property.type === 'list') {
      const childPath = path ? `${path}.items` : 'items';
      this.logModelTreeRecursive(childPath, depth + 1);
    }
  }

  private logContentTree() {
    console.log('--- Content Tree ---');
    this.logContentTreeRecursive(this.path);
  }

  private logContentTreeRecursive(path: string, depth: number = 0) {
    const content = this.treeStateController.getContentByPath(path);
    const block = this.treeStateController.getBlock(path);
    const indent = '  '.repeat(depth);

    if (block) {
      console.log(`${indent}${block.modelProperty.key} (${block.modelProperty.type}): ${JSON.stringify(content)}`);
      const childBlocks = this.treeStateController.getChildBlocks(path);
      childBlocks.forEach(childBlock => {
        this.logContentTreeRecursive(childBlock.path, depth + 1);
      });
    } else {
      console.log(`${indent}${path}: ${JSON.stringify(content)}`);
    }
  }
}