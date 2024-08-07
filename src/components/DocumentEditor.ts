import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { TreeStateController } from '../controllers/TreeStateController';
import { ModelStateController } from '../controllers/ModelStateController';
import { ModelLibrary } from '../content/ModelLibrary';
import './BlockComponent';

@customElement('document-editor')
export class DocumentEditor extends LitElement {
  @state() private rootPath: string = 'root';
  @state() private testCounter: number = 0;

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
    .button-container {
      margin-top: 16px;
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
    this.treeStateController = new TreeStateController(this, modelDefinition, this.modelStateController);
    
    // Initialize with a default title
    this.treeStateController.setContentByPath('root.title', 'Initial Title');
    
    this.requestUpdate();
  }

  render() {
    if (!this.treeStateController || !this.modelStateController) {
      return html`<div>Loading...</div>`;
    }

    const title = this.treeStateController.getContentByPath('root.title') || 'Untitled';

    return html`
      <div class="document">
        <h1>${title}</h1>
        <block-component
          .path=${this.rootPath}
          .treeStateController=${this.treeStateController}
          .modelStateController=${this.modelStateController}
        ></block-component>
      </div>
      <div class="button-container">
        <button @click=${this.testReactivity}>Test Reactivity</button>
        <p>Test Counter: ${this.testCounter}</p>
      </div>
    `;
  }

  private testReactivity() {
    this.testCounter++;
    if (this.treeStateController) {
      const titlePath = 'root.title';
      const currentTitle = this.treeStateController.getContentByPath(titlePath) || 'Untitled';
      const newTitle = `${currentTitle} (Updated)`;
      this.treeStateController.setContentByPath(titlePath, newTitle);
      // Note: We don't need to call this.requestUpdate() here as TreeStateController should handle it
    }
  }
}