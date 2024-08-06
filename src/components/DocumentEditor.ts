import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { TreeStateController } from '../controllers/TreeStateController';
import { ModelStateController } from '../controllers/ModelStateController';
import { ModelLibrary } from '../content/ModelLibrary';
import './BlockComponent';

@customElement('document-editor')
export class DocumentEditor extends LitElement {
  private treeStateController?: TreeStateController;
  private modelStateController?: ModelStateController;

  constructor() {
    super();
    this.initializeControllers();
  }

  private async initializeControllers() {
    const modelLibrary = new ModelLibrary();
    const modelDefinition = modelLibrary.getModel('person');

    if (!modelDefinition) {
      console.error('Model definition not found');
      return;
    }

    this.modelStateController = new ModelStateController(this, modelDefinition);
    this.treeStateController = new TreeStateController(this, this.modelStateController.getModelTree());
    
    this.requestUpdate();
  }

  render() {
    if (!this.modelStateController || !this.treeStateController) {
      return html`<p>Loading...</p>`;
    }

    const rootModelProperty = this.modelStateController.getModelDefinition();
    
    if (!rootModelProperty) {
      return html`<p>Error: Root model property not found</p>`;
    }

    return html`
      <div class="document">
        <block-component
          .modelProperty=${rootModelProperty}
          .path=${''}
          .treeStateController=${this.treeStateController}
          .modelStateController=${this.modelStateController}
        ></block-component>
      </div>
    `;
  }
}