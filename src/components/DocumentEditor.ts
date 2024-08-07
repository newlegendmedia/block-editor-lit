import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { TreeStateController } from '../controllers/TreeStateController';
import { ModelStateController } from '../controllers/ModelStateController';
import { ModelLibrary } from '../content/ModelLibrary';
import { ContentModelTree } from '../tree/ContentModelTree';
import { DocumentBlock } from '../blocks/DocumentBlock';
import './BlockComponent';

@customElement('document-editor')
export class DocumentEditor extends LitElement {
  @state() private documentBlock?: DocumentBlock;

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
    
    this.treeStateController.initializeWithDocument(modelDefinition);
    
    this.documentBlock = new DocumentBlock(modelDefinition, '', this.treeStateController, this.modelStateController);

    this.requestUpdate();
  }

  render() {
    return html`
      <div class="document">
        ${this.documentBlock ? html`
          <block-component
            .block=${this.documentBlock}
            .treeStateController=${this.treeStateController}
            .modelStateController=${this.modelStateController}
          ></block-component>
        ` : 'Loading...'}
      </div>
    `;
  }
}