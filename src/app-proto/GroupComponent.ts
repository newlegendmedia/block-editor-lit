import { LitElement, html, css, TemplateResult } from 'lit';
import { property, customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import type { Property, GroupProperty, PropertyReference } from './model';
import { ComponentFactory } from './app';
import { UnifiedLibrary } from './ModelLibrary';
import { isGroup, isPropertyReference } from './model';

interface GroupItem {
  __type: string;
  value: any;
}

@customElement('group-component')
export class GroupComponent extends LitElement {
  @property({ type: Object }) model!: GroupProperty;
  @property({ type: Array }) data: GroupItem[] = [];
  @property({ type: Object }) library!: UnifiedLibrary;
  @state() private showMenu: boolean = false;

  get editable(): boolean {
    return this.model.editable || false;
  }

  static styles = css`
    :host {
      display: block;
      margin-bottom: 10px;
      border: 1px solid #ddd;
      padding: 10px;
    }
    .add-button {
      margin-top: 10px;
    }
    .slash-menu {
      margin-top: 10px;
    }
    .error {
      color: red;
      font-weight: bold;
    }
    .warning {
      color: orange;
      font-style: italic;
    }
  `;

  render(): TemplateResult {
    if (!this.model || !this.library) {
      return html`<div class="error">Error: Invalid group configuration or missing library</div>`;
    }

    return html`
      <fieldset>
        <legend>${this.model.name || 'Unnamed Group'}</legend>
        ${this.renderGroup()}
        ${this.editable ? this.renderAddButton() : ''}
        ${this.showMenu ? this.renderSlashMenu() : ''}
      </fieldset>
    `;
  }

  private renderGroup(): TemplateResult {
    if (this.data.length === 0) {
      return html`<div class="warning">This group is currently empty.</div>`;
    }

    return html`
      ${repeat(this.data, (item) => item.__type, (item, index) => {
        const itemType = this.getItemTypeByKey(item.__type);
        if (!itemType) {
          return html`<div class="error">Error: Unknown item type ${item.__type}</div>`;
        }
        return html`
          <div>
            ${ComponentFactory.createComponent(itemType, item.value, this.library)}
            ${this.editable ? html`<button @click=${() => this.removeItem(index)}>Remove</button>` : ''}
          </div>
        `;
      })}
    `;
  }

  private renderAddButton(): TemplateResult {
    return html`<button class="add-button" @click=${this.toggleSlashMenu}>Add Block</button>`;
  }

  private renderSlashMenu(): TemplateResult {
    const itemTypes = this.getItemTypes();
    return html`
      <div class="slash-menu">
        ${repeat(itemTypes, (itemType) => itemType.key, (itemType) => html`
          <button @click=${() => this.addBlock(itemType)}>
            ${itemType.name || itemType.key}
          </button>
        `)}
      </div>
    `;
  }

  private getItemTypes(): (Property | PropertyReference)[] {
    if (Array.isArray(this.model.itemTypes)) {
      return this.model.itemTypes;
    } else if (isPropertyReference(this.model.itemTypes)) {
      const resolved = this.library.getDefinition(this.model.itemTypes.ref, this.model.itemTypes.type);
      if (resolved && isGroup(resolved)) {
        return Array.isArray(resolved.itemTypes) ? resolved.itemTypes : [resolved.itemTypes];
      }
    }
    console.warn(`Invalid itemTypes: ${JSON.stringify(this.model.itemTypes)}`);
    return [];
  }

  private getItemTypeByKey(key: string): Property | PropertyReference | undefined {
    const itemTypes = this.getItemTypes();
    return itemTypes.find(itemType => {
      if (isPropertyReference(itemType)) {
        return itemType.ref === key || itemType.key === key;
      } else {
        return itemType.key === key || itemType.type === key;
      }
    });
  }
  
  private toggleSlashMenu() {
    this.showMenu = !this.showMenu;
  }

  private addBlock(itemType: Property | PropertyReference) {
    const key = isPropertyReference(itemType) ? itemType.ref : itemType.key;
    if (!key) return;
    
    const newItem: GroupItem = {
      __type: key,
      value: ComponentFactory.createEmptyItem(itemType)
    };
    this.data = [...this.data, newItem];
    this.showMenu = false;
    this.requestUpdate();
    this.dispatchEvent(new CustomEvent('value-changed', {
      detail: { key: this.model.key, value: this.data },
      bubbles: true,
      composed: true
    }));
  }

  private removeItem(index: number) {
    this.data = this.data.filter((_, i) => i !== index);
    this.requestUpdate();
    this.dispatchEvent(new CustomEvent('value-changed', {
      detail: { key: this.model.key, value: this.data },
      bubbles: true,
      composed: true
    }));
  }

  protected handleValueChanged(e: CustomEvent) {
    const { key, value } = e.detail;
    const index = this.data.findIndex(item => item.__type === key);
    if (index !== -1) {
      const newData = [...this.data];
      newData[index] = { ...newData[index], value };
      this.data = newData;
      this.requestUpdate();
      this.dispatchEvent(new CustomEvent('value-changed', { 
        detail: { key: this.model.key, value: this.data },
        bubbles: true,
        composed: true
      }));
    }
  }
}