import { BaseBlock } from './BaseBlock';
import { BlockData, SimplifiedModelDefinition } from '../types/ModelDefinition';
import { html, TemplateResult } from 'lit';
import { ReactiveControllerHost } from 'lit';

export class DocumentBlock extends BaseBlock {
  constructor(
    blockData: BlockData,
    modelDefinition: SimplifiedModelDefinition,
    path: string,
    host: ReactiveControllerHost
  ) {
    super(blockData, modelDefinition, path, host);
  }

  render(): TemplateResult {
    console.log("DocumentBlock render started");
    const result = html`
      <div class="document-block">
        <h1>Document Editor</h1>
        ${this.renderContent()}
      </div>
    `;
    console.log("DocumentBlock render completed");
    return result;
  }
  
  renderContent(): TemplateResult {
    console.log("DocumentBlock renderContent started");
    const title = this.blockData.content?.title || 'Untitled Document';
    console.log("Document title:", title);
    const result = html`
      <div class="document-content">
        <h2>${title}</h2>
        <!-- Add more document content rendering here -->
      </div>
    `;
    console.log("DocumentBlock renderContent completed");
    return result;
  }

  // // The logDocumentStructure method is kept here but not rendered in the template
  // logDocumentStructure() {
  //   console.log('=== Document Structure ===');
  //   this.logModelTree();
  //   this.logContentTree();
  // }

  // private logModelTree() {
  //   console.log('--- Model Tree ---');
  //   this.logModelTreeRecursive();
  // }

  // private logModelTreeRecursive(path: string = '', depth: number = 0) {
  //   const property = this.modelStateController.getModelPropertyByPath(path);
  //   if (!property) return;

  //   const indent = '  '.repeat(depth);
  //   console.log(`${indent}${property.key} (${property.type})`);

  //   if (property.type === 'model' || property.type === 'group') {
  //     property.properties?.forEach(childProp => {
  //       const childPath = path ? `${path}.${childProp.key}` : childProp.key;
  //       this.logModelTreeRecursive(childPath, depth + 1);
  //     });
  //   } else if (property.type === 'list') {
  //     const childPath = path ? `${path}.items` : 'items';
  //     this.logModelTreeRecursive(childPath, depth + 1);
  //   }
  // }

  // private logContentTree() {
  //   console.log('--- Content Tree ---');
  //   this.logContentTreeRecursive(this.path);
  // }

  // private logContentTreeRecursive(path: string, depth: number = 0) {
  //   const content = this.treeStateController.getContentByPath(path);
  //   const block = this.treeStateController.getBlock(path);
  //   const indent = '  '.repeat(depth);

  //   if (block) {
  //     console.log(`${indent}${block.modelProperty.key} (${block.modelProperty.type}): ${JSON.stringify(content)}`);
  //     const childBlocks = this.treeStateController.getChildBlocks(path);
  //     childBlocks.forEach(childBlock => {
  //       this.logContentTreeRecursive(childBlock.path, depth + 1);
  //     });
  //   } else {
  //     console.log(`${indent}${path}: ${JSON.stringify(content)}`);
  //   }
  // }
}