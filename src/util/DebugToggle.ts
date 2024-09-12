import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { DebugController } from "./DebugController";

@customElement("debug-toggle")
export class DebugToggle extends LitElement {
  private debugController: DebugController;

  constructor() {
    super();
    this.debugController = new DebugController(this);
  }

  render() {
    return html`${this.debugController.renderDebugButton()}`;
  }
}
