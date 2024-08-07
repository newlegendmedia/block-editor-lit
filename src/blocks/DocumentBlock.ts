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

  render(): TemplateResult {
    const children = this.getChildren();

    return html`
      <div class="document-block">
        <h1>Document Editor</h1>
        ${children.map((child) => child.render())}
      </div>
      <button class="log-button" @click=${this.logDocumentStructure}>Log Document Structure</button>
    `;
  }

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
    this.logContentTreeRecursive();
  }

  private logContentTreeRecursive(path: string = '', depth: number = 0) {
    const content = this.treeStateController.getContentByPath(path);
    const indent = '  '.repeat(depth);

    if (typeof content === 'object' && content !== null) {
      console.log(`${indent}${path || 'root'}:`);
      Object.entries(content).forEach(([key, value]) => {
        const childPath = path ? `${path}.${key}` : key;
        if (typeof value === 'object' && value !== null) {
          this.logContentTreeRecursive(childPath, depth + 1);
        } else {
          console.log(`${indent}  ${key}: ${value}`);
        }
      });
    } else {
      console.log(`${indent}${path}: ${content}`);
    }
  }
}