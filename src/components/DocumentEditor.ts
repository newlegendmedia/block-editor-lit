import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { TreeStateController } from '../controllers/TreeStateController';
import { ModelStateController } from '../controllers/ModelStateController';
import './BlockComponent';
import { ModelLibrary } from '../content/ModelLibrary';

@customElement('document-editor')
export class DocumentEditor extends LitElement {
  @state() private rootPath: string = 'root';

  private treeStateController?: TreeStateController;
  private modelStateController?: ModelStateController;
  private testCounter = 0;

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
    .button-container {
      margin-top: 16px;
    }
  `;

  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
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
    this.treeStateController = new TreeStateController(this, modelDefinition, this.modelStateController);
    
    // Initialize with a default title
    this.treeStateController.setContentByPath('root.title', 'Initial Title');
    
    this.requestUpdate();
  }

  render() {
    console.log("DocumentEditor render started");
    if (!this.treeStateController || !this.modelStateController) {
      console.log("Controllers not initialized");
      return html`<div>Loading...</div>`;
    }
  
    const rootBlockData = this.treeStateController.getBlockData(this.rootPath);
    console.log("Root block data:", rootBlockData);
    
    const result = html`
      <div class="document">
        <block-component
          .path=${this.rootPath}
          .blockData=${rootBlockData.blockData}
          .modelDefinition=${rootBlockData.modelDefinition}
        ></block-component>
      </div>
    `;
    console.log("DocumentEditor render completed");
    return result;
  }

  private testReactivity() {
    this.testCounter++;
    if (this.treeStateController) {
      const titlePath = 'root.title';
      const currentTitle = this.treeStateController.getBlockData(titlePath).blockData.content || 'Untitled';
      const newTitle = `${currentTitle} (Updated)`;
      // We need to update this method in TreeStateController
      this.treeStateController.setContentByPath(titlePath, newTitle);
    }
  }


}