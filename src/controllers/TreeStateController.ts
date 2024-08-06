// TreeStateController.ts
import { ReactiveController, ReactiveControllerHost } from 'lit';
import { ContentModelTree } from '../tree/ContentModelTree';
import { ContentDataTree } from '../tree/ContentDataTree';
import { Property } from '../types/ModelDefinition'; // Make sure this import is correct

export class TreeStateController implements ReactiveController {
  private host: ReactiveControllerHost;
  private contentTree: ContentDataTree<string>;
  private modelTree: ContentModelTree<string>;

  constructor(host: ReactiveControllerHost, modelTree: ContentModelTree<string>) {
    this.host = host;
    this.host.addController(this);
    this.modelTree = modelTree;
    this.contentTree = new ContentDataTree<string>('root');
  }

  hostConnected() {
    // Any initialization logic when the host element is connected
  }

  hostDisconnected() {
    // Any cleanup logic when the host element is disconnected
  }

  getContentByPath(path: string): any {
    return this.contentTree.getValueByPath(path);
  }

  setContentByPath(path: string, value: any) {
    this.contentTree.setValueByPath(path, value);
    this.host.requestUpdate();
  }

  getModelPropertyByPath(path: string): Property | undefined {
    return this.modelTree.getPropertyByPath(path);
  }


}