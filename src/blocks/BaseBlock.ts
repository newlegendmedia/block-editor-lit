import { ReactiveController, ReactiveControllerHost, TemplateResult, html } from 'lit';
import { Property } from '../types/ModelDefinition';
import { TreeStateController } from '../controllers/TreeStateController';
import { ModelStateController } from '../controllers/ModelStateController';

export abstract class BaseBlock implements ReactiveController {
  protected host: ReactiveControllerHost;

  constructor(
    public modelProperty: Property,
    public path: string,
    public treeStateController: TreeStateController,
    public modelStateController: ModelStateController
  ) {
    this.host = treeStateController.host;
    this.host.addController(this);
  }

  updateHost(newHost: ReactiveControllerHost) {
    this.host.removeController(this);
    this.host = newHost;
    this.host.addController(this);
  }

  abstract render(): TemplateResult;

  getContent(): any {
    return this.treeStateController.getContentByPath(this.path);
  }

  setContent(content: any): void {
    this.treeStateController.setContentByPath(this.path, content);
  }

  addChild(_child: BaseBlock): void {
    // Implementation depends on the specific block type
  }

  removeChild(_child: BaseBlock): void {
    // Implementation depends on the specific block type
  }

  getChildren(): BaseBlock[] {
    return this.treeStateController.getChildBlocks(this.path);
  }

  update(_changedProperties: Map<string, any>): void {
    // Default update logic
  }

  // Implement other ReactiveController methods
  hostConnected(): void {}
  hostDisconnected(): void {}
  hostUpdate(): void {}
  hostUpdated(): void {}

  // New method to render content without child blocks
  renderContent(): TemplateResult {
    return html``;
  }
}

export class ElementBlock extends BaseBlock {
  renderContent(): TemplateResult {
    const content = this.getContent();
    return html`
      <div class="element-block">
        <label>${this.modelProperty.label || this.modelProperty.key}</label>
        <input type="text" .value=${content || ''} @input=${this.handleInput} />
      </div>
    `;
  }

  render(): TemplateResult {
    return this.renderContent();
  }

  private handleInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.setContent(input.value);
  }
}

export class ModelBlock extends BaseBlock {
  renderContent(): TemplateResult {
    return html`
      <div class="model-block">
        <h3>${this.modelProperty.label || this.modelProperty.key}</h3>
      </div>
    `;
  }

  render(): TemplateResult {
    return this.renderContent();
  }
}

export class ListBlock extends BaseBlock {
  renderContent(): TemplateResult {
    return html`
      <div class="list-block">
        <h3>${this.modelProperty.label || this.modelProperty.key}</h3>
        <button @click=${this.handleAddItem}>Add Item</button>
      </div>
    `;
  }

  render(): TemplateResult {
    return this.renderContent();
  }

  private handleAddItem() {
    const listProperty = this.modelProperty as Property & { items: Property };
    this.treeStateController.addChildBlock(this.path, listProperty.items);
  }
}

export class GroupBlock extends BaseBlock {
  renderContent(): TemplateResult {
    return html`
      <div class="group-block">
        <h3>${this.modelProperty.label || this.modelProperty.key}</h3>
      </div>
    `;
  }

  render(): TemplateResult {
    return this.renderContent();
  }
}