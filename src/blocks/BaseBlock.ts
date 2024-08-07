import { ReactiveController, ReactiveControllerHost, TemplateResult, html } from 'lit';
import { BlockData, SimplifiedModelDefinition } from '../types/ModelDefinition';

export abstract class BaseBlock implements ReactiveController {
  protected host: ReactiveControllerHost;

  constructor(
    public blockData: BlockData,
    public modelDefinition: SimplifiedModelDefinition,
    public path: string,
    host: ReactiveControllerHost
  ) {
    this.host = host;
//    this.host.addController(this);
  }

  abstract render(): TemplateResult;

  getContent(): any {
    return this.blockData.content;
  }

  setContent(content: any): void {
    this.blockData.content = content;
    this.requestUpdate();
  }
  
  protected requestUpdate() {
    this.host.requestUpdate();
  }

  // Implement other ReactiveController methods
  hostConnected() {}
  hostDisconnected() {}
  hostUpdate() {}
  hostUpdated() {}
}

export class ElementBlock extends BaseBlock {
  render(): TemplateResult {
    return html`
      <div class="element-block">
        <label>${this.modelDefinition.label}</label>
        <input type="text" .value=${this.getContent() || ''} @input=${this.handleInput} />
      </div>
    `;
  }

  private handleInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.setContent(input.value);
  }
}

export class ModelBlock extends BaseBlock {
  render(): TemplateResult {
    return html`
      <div class="model-block">
        <h3>${this.modelDefinition.label}</h3>
      </div>
    `;
  }
}

export class ListBlock extends BaseBlock {
  render(): TemplateResult {
    return html`
      <div class="list-block">
        <h3>${this.modelDefinition.label}</h3>
        <button @click=${this.handleAddItem}>Add Item</button>
      </div>
    `;
  }

  private handleAddItem() {
    // We'll need to implement this later
    console.log('Add item to list');
  }
}

export class GroupBlock extends BaseBlock {
  render(): TemplateResult {
    return html`
      <div class="group-block">
        <h3>${this.modelDefinition.label}</h3>
      </div>
    `;
  }
}