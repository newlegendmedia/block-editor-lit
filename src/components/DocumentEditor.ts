// Update DocumentEditor.ts
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { TreeStateController } from '../controllers/TreeStateController';
import { ModelStateController } from '../controllers/ModelStateController';
import { ModelLibrary } from '../content/ModelLibrary';
import { BaseBlock } from '../blocks/BaseBlock';
import { ContentModelTree } from '../tree/ContentModelTree';
import './BlockComponent';  // Import the new BlockComponent
import { isModel, isGroup, isList } from '../types/ModelDefinition';

@customElement('document-editor')
export class DocumentEditor extends LitElement {
  @state() private rootBlock?: BaseBlock;

  private treeStateController?: TreeStateController;
  private modelStateController?: ModelStateController;


  static styles = css`
    :host {
      display: block;
      padding: 16px;
      max-width: 800px;
      margin: 0 auto;
    }
    .document {
      border: 1px solid #ccc;
      padding: 16px;
    }
    .log-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 10px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    }
  `;

  constructor() {
    super();
    this.initializeControllers();
  }

  private async initializeControllers() {
    
    const modelLibrary = new ModelLibrary();
    const modelDefinition = modelLibrary.getModel('document');

    if (!modelDefinition) {
      console.error('Document model definition not found');
      return;
    }

    

    this.modelStateController = new ModelStateController(this, modelDefinition);
    this.treeStateController = new TreeStateController(
      this, 
      new ContentModelTree<string>('root', modelDefinition),
      this.modelStateController
    );
    
    // Initialize the document structure
    this.treeStateController.initializeWithDocument(modelDefinition);
    
    // Get the root block
    this.rootBlock = this.treeStateController.getBlock('');

    

    this.requestUpdate();
  }

  render() {
    return html`
      <div class="document">
        <h1>Document Editor</h1>
        ${this.rootBlock ? html`
          <block-component
            .block=${this.rootBlock}
            .treeStateController=${this.treeStateController}
            .modelStateController=${this.modelStateController}
          ></block-component>
        ` : 'Loading...'}
      </div>
      <button class="log-button" @click=${this.logDocumentStructure}>Log Document Structure</button>
    `;
  }

  private logDocumentStructure() {
    console.log('=== Document Structure ===');
    this.logModelTree();
    this.logContentTree();
  }

  private logModelTree() {
    if (!this.modelStateController) {
      console.log('Model State Controller not initialized');
      return;
    }

    console.log('--- Model Tree ---');
    this.logModelTreeRecursive();
  }

  private logModelTreeRecursive(path: string = '', depth: number = 0) {
    const property = this.modelStateController!.getModelPropertyByPath(path);
    if (!property) return;

    const indent = '  '.repeat(depth);
    console.log(`${indent}${property.key} (${property.type})`);

    if (isModel(property) || isGroup(property)) {
      property.properties?.forEach(childProp => {
        const childPath = path ? `${path}.${childProp.key}` : childProp.key;
        this.logModelTreeRecursive(childPath, depth + 1);
      });
    } else if (isList(property)) {
      const childPath = path ? `${path}.items` : 'items';
      this.logModelTreeRecursive(childPath, depth + 1);
    }
  }

  private logContentTree() {
    if (!this.treeStateController) {
      console.log('Tree State Controller not initialized');
      return;
    }

    console.log('--- Content Tree ---');
    this.logContentTreeRecursive();
  }

  private logContentTreeRecursive(path: string = '', depth: number = 0) {
    const content = this.treeStateController!.getContentByPath(path);
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