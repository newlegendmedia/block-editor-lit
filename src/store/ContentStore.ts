// ContentStore.ts
import { Content, ContentId, ModelInfo, CompositeContent, isCompositeContent, Document, DocumentId } from '../content/content';
import { Model, isElement, isArray, isGroup, isObject, AtomType } from '../model/model';
import { ContentItemMap } from './ContentItemMap';
import { ContentDependencyMap } from './ContentDependencyMap';
import { ContentStorageAdapter, LocalStorageAdapter } from './ContentStorageAdapter';

type ContentChangeCallback = (change: { type: 'add' | 'update' | 'delete', id: ContentId, content?: Content }) => void;

export class ContentStore {
  private itemMap: ContentItemMap;
  private dependencyMap: ContentDependencyMap;
  private storageAdapter: ContentStorageAdapter;
  private activeDocuments: Map<DocumentId, Document> = new Map();
  private globalChangeSubscribers: Set<ContentChangeCallback> = new Set();

  constructor(
    itemMap: ContentItemMap,
    dependencyMap: ContentDependencyMap,
    storageAdapter: ContentStorageAdapter
  ) {
    this.itemMap = itemMap;
    this.dependencyMap = dependencyMap;
    this.storageAdapter = storageAdapter;
  }

  subscribeToAllChanges(callback: ContentChangeCallback): () => void {
    this.globalChangeSubscribers.add(callback);
    return () => this.globalChangeSubscribers.delete(callback);
  }

  private notifyGlobalSubscribers(change: { type: 'add' | 'update' | 'delete', id: ContentId, content?: Content }) {
    this.globalChangeSubscribers.forEach(callback => callback(change));
  }

  async getAllActiveContents(): Promise<Map<ContentId, Content>> {
    const allContents = new Map<ContentId, Content>();
    
    for (const document of this.activeDocuments.values()) {
      await this.collectContentRecursive(document.rootBlock, allContents);
    }

    return allContents;
  }

  private async collectContentRecursive(contentId: ContentId, collection: Map<ContentId, Content>): Promise<void> {
    const content = await this.getContent(contentId);
    if (content) {
      collection.set(contentId, content);
      if (isCompositeContent(content)) {
        for (const childId of content.children) {
          await this.collectContentRecursive(childId, collection);
        }
      }
    }
  }  

  async getContent<T>(id: ContentId): Promise<Content<T> | undefined> {
    let content = this.itemMap.get<T>(id);
    if (!content) {
      content = await this.storageAdapter.loadContent<T>(id);
      if (content) {
        this.itemMap.set(id, content);
        if (isCompositeContent(content)) {
          this.dependencyMap.updateDependencies(id, content.children);
        }
        this.notifyGlobalSubscribers({ type: 'add', id, content });
      }
    }
    return content;
  }

  async updateContent<T>(id: ContentId, updater: (content: Content<T>) => Content<T>): Promise<void> {
    const currentContent = await this.getContent<T>(id);
    if (currentContent) {
      const updatedContent = updater(currentContent);
      this.itemMap.set(id, updatedContent);
      if (isCompositeContent(updatedContent)) {
        this.dependencyMap.updateDependencies(id, updatedContent.children);
      }
      await this.storageAdapter.saveContent(updatedContent);
      this.notifyGlobalSubscribers({ type: 'update', id, content: updatedContent });
    } else {
      throw new Error(`Content with id ${id} not found`);
    }
  }

  async deleteContent(id: ContentId): Promise<void> {
    if (this.dependencyMap.canDelete(id)) {
      this.itemMap.delete(id);
      this.dependencyMap.removeDependencies(id);
      await this.storageAdapter.deleteContent(id);
      this.notifyGlobalSubscribers({ type: 'delete', id });
    } else {
      throw new Error(`Cannot delete content ${id} as it has dependencies`);
    }
  }

  observe<T = unknown>(id: ContentId, observer: (content: Content<T> | undefined) => void): () => void {
    return this.itemMap.observe(id, observer);
  }

  async createContent<T = unknown>(model: Model, initialContent?: T): Promise<Content<T>> {
    const id = this.generateUniqueId();
    const modelInfo: ModelInfo = {
      type: model.type,
      key: model.key,
      ref: 'ref' in model ? model.ref : undefined
    };
    const content: Content<T> = {
      id,
      modelInfo,
      modelDefinition: 'ref' in model ? undefined : model,
      content: initialContent ?? this.getDefaultContent(model) as T,
    };

    if (isCompositeContent(content)) {
      (content as CompositeContent).children = [];
    }

    await this.storageAdapter.saveContent(content);
    this.itemMap.set(id, content);
    this.notifyGlobalSubscribers({ type: 'add', id, content });
    return content;
  }

  updateDependencies(parentId: ContentId, childIds: ContentId[]): void {
    this.dependencyMap.updateDependencies(parentId, childIds);
  }

  private generateUniqueId(): string {
    return 'id_' + Math.random().toString(36).substr(2, 9);
  }

	private getDefaultContent(property: Model): any {
		if (isElement(property)) {
			switch (property.base) {
				case AtomType.Boolean:
					return false;
				case AtomType.Number:
					return 0;
				case AtomType.Datetime:
					return new Date().toISOString();
				case AtomType.Text:
				case AtomType.Enum:
				case AtomType.File:
				case AtomType.Reference:
					return '';
				default:
					console.warn(`Unknown element base type: ${property.base}`);
					return null;
			}
		} else if (isObject(property)) {
			return property.properties.reduce((acc, prop) => {
				acc[prop.key!] = this.getDefaultContent(prop);
				return acc;
			}, {} as Record<string, any>);
		} else if (isArray(property)) {
			return [];
		} else if (isGroup(property)) {
			return [];
		} else {
			console.warn(`Unknown property type: ${property.type}`);
			return null;
		}
  }
  
  async openDocument(document: Document): Promise<void> {
    this.activeDocuments.set(document.id, document);
    await this.loadDocumentContent(document);
  }

  private async loadDocumentContent(document: Document): Promise<void> {
    // Load the root block
    let rootBlock = await this.getContent(document.rootBlock);
    
    if (!rootBlock) {
      // If the root block doesn't exist, create it
      rootBlock = {
        id: document.rootBlock,
        modelInfo: {
          type: 'object',
          key: 'rootBlock',
          ref: "notion"
        },
        content: [],
      };
      await this.storageAdapter.saveContent(rootBlock);
    }

    // Add the root block to the itemMap
    this.itemMap.set(document.rootBlock, rootBlock);

    // Load children recursively
    if (isCompositeContent(rootBlock)) {
      for (const childId of rootBlock.children) {
        await this.loadContentRecursive(childId);
      }
    }
  }

  async closeDocument(documentId: DocumentId): Promise<void> {
    this.activeDocuments.delete(documentId);
    // Unload the document's content from memory
    await this.unloadDocumentContent(documentId);
  }

  getActiveDocuments(): Document[] {
    return Array.from(this.activeDocuments.values());
  }

  isDocumentActive(documentId: DocumentId): boolean {
    return this.activeDocuments.has(documentId);
  }

  private async unloadDocumentContent(documentId: DocumentId): Promise<void> {
    const document = this.activeDocuments.get(documentId);
    if (document) {
      await this.unloadContentRecursive(document.rootBlock);
    }
  }

  private async loadContentRecursive(contentId: ContentId): Promise<void> {
    const content = await this.getContent(contentId);
    if (content && isCompositeContent(content)) {
      for (const childId of content.children) {
        await this.loadContentRecursive(childId);
      }
    }
  }

  private async unloadContentRecursive(contentId: ContentId): Promise<void> {
    const content = this.itemMap.get(contentId);
    if (content) {
      if (isCompositeContent(content)) {
        for (const childId of content.children) {
          await this.unloadContentRecursive(childId);
        }
      }
      this.itemMap.delete(contentId);
      this.dependencyMap.removeDependencies(contentId);
    }
  }
}

// Create and export a singleton instance
export const contentStore = new ContentStore(
  new ContentItemMap(),
  new ContentDependencyMap(),
  new LocalStorageAdapter()
);
