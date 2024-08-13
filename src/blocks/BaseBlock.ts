import { ReactiveController, ReactiveControllerHost, TemplateResult, html } from 'lit';
import { Property } from '../types/ModelDefinition';
import { TreeStateController } from '../controllers/TreeStateController';
import { ModelStateController } from '../controllers/ModelStateController';
//import { isElement, isModel, isList, isGroup } from '../types/ModelDefinition';

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
    this.requestUpdate();
  }

  protected requestUpdate() {
    this.host.requestUpdate();
  }

  update(_changedProperties: Map<string, any>): void {
    // Implement update logic here
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
  render(): TemplateResult {
    const content = this.getContent();
    return html`
      <div class="element-block">
        <label>${this.modelProperty.label || this.modelProperty.key}</label>
        <input 
          type="text" 
          .value=${content || ''} 
          @input=${this.handleInput}
          placeholder=${this.modelProperty.label || this.modelProperty.key}
        />
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
    console.log(`Rendering ModelBlock: ${this.path}`);
    return html`
      <div class="model-block">
        <h3>${this.modelProperty.label || this.modelProperty.key}</h3>
        ${this.renderChildBlocks()}
      </div>
    `;
  }

  protected renderChildBlocks(): TemplateResult {
    const childBlocks = this.treeStateController.getChildBlocks(this.path);
    console.log(`Rendering child blocks for ModelBlock ${this.path}:`, childBlocks.map(b => b.path));
    return html`
      <div class="model-children">
        ${childBlocks.map(childBlock => html`
          <block-component
            .path=${childBlock.path}
            .treeStateController=${this.treeStateController}
            .modelStateController=${this.modelStateController}
          ></block-component>
        `)}
      </div>
    `;
  }
}

export class ListBlock extends BaseBlock {
  render(): TemplateResult {
    console.log(`Rendering ListBlock: ${this.path}`);
    return html`
      <div class="list-block">
        <h3>${this.modelProperty.label || this.modelProperty.key}</h3>
        ${this.renderChildBlocks()}
        <button @click=${this.handleAddItem}>Add Item</button>
      </div>
    `;
  }

  protected renderChildBlocks(): TemplateResult {
    const items = this.getContent() || [];
    console.log(`Rendering list items for ListBlock ${this.path}:`, items.length);
    return html`
      <ul>
        ${items.map((_: any, index: any) => {
          const itemPath = `${this.path}.${index}`;
          return html`
            <li>
              <block-component
                .path=${itemPath}
                .treeStateController=${this.treeStateController}
                .modelStateController=${this.modelStateController}
              ></block-component>
            </li>
          `;
        })}
      </ul>
    `;
  }

  private handleAddItem() {
    const listProperty = this.modelProperty as Property & { items: Property };
    this.treeStateController.addChildBlock(this.path, listProperty.items);
  }
}

export class GroupBlock extends BaseBlock {
  render(): TemplateResult {
    console.log(`Rendering GroupBlock: ${this.path}`);
    return html`
      <div class="group-block">
        <h3>${this.modelProperty.label || this.modelProperty.key}</h3>
        ${this.renderChildBlocks()}
      </div>
    `;
  }

  protected renderChildBlocks(): TemplateResult {
    const childBlocks = this.treeStateController.getChildBlocks(this.path);
    console.log(`Rendering child blocks for GroupBlock ${this.path}:`, childBlocks.map(b => b.path));
    return html`
      <div class="group-children">
        ${childBlocks.map(childBlock => html`
          <block-component
            .path=${childBlock.path}
            .treeStateController=${this.treeStateController}
            .modelStateController=${this.modelStateController}
          ></block-component>
        `)}
      </div>
    `;
  }
}

// export function createBlock(
//   property: Property, 
//   path: string, 
//   treeStateController: TreeStateController, 
//   modelStateController: ModelStateController
// ): BaseBlock {
//   if (isElement(property)) {
//     return new ElementBlock(property, path, treeStateController, modelStateController);
//   } else if (isModel(property)) {
//     return new ModelBlock(property, path, treeStateController, modelStateController);
//   } else if (isList(property)) {
//     return new ListBlock(property, path, treeStateController, modelStateController);
//   } else if (isGroup(property)) {
//     return new GroupBlock(property, path, treeStateController, modelStateController);
//   } else {
//     throw new Error(`Unknown property type for ${path}`);
//   }
//}