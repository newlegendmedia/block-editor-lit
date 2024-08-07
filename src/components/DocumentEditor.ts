import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { TreeStateController } from '../controllers/TreeStateController';
import { ModelStateController } from '../controllers/ModelStateController';
import { ModelLibrary } from '../content/ModelLibrary';
import './BlockComponent';

@customElement('document-editor')
export class DocumentEditor extends LitElement {
  @state() private rootPath: string = 'root';

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
    
    this.requestUpdate();
  }

  render() {
    if (!this.treeStateController || !this.modelStateController) {
      return html`<div>Loading...</div>`;
    }

    return html`
      <div class="document">
        <block-component
          .path=${this.rootPath}
          .treeStateController=${this.treeStateController}
          .modelStateController=${this.modelStateController}
        ></block-component>
      </div>
      <button class="log-button" @click=${this.logDocumentStructure}>Log Document Structure</button>
    `;
  }

  private logDocumentStructure() {
    const documentBlock = this.treeStateController?.getBlock(this.rootPath);
    if (documentBlock && 'logDocumentStructure' in documentBlock) {
      (documentBlock as any).logDocumentStructure();
    } else {
      console.error('Unable to log document structure: DocumentBlock not found or method not available');
    }
  }
}