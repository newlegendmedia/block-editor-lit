import { Content, ContentId, ModelInfo, CompositeContent, isCompositeContent, Document, DocumentId } from '../content/content';
import { Model, isElement, isArray, isGroup, isObject, AtomType } from '../model/model';
import { ContentItemMap } from './ContentItemMap';
import { ContentDependencyMap } from './ContentDependencyMap';
import { ContentStorageAdapter, LocalStorageAdapter } from './ContentStorageAdapter';

export class ContentStore {
  private itemMap: ContentItemMap;
  private dependencyMap: ContentDependencyMap;
  private storageAdapter: ContentStorageAdapter;
  private documentCache: Map<DocumentId, Document> = new Map();

  constructor(
    itemMap: ContentItemMap,
    dependencyMap: ContentDependencyMap,
    storageAdapter: ContentStorageAdapter
  ) {
    this.itemMap = itemMap;
    this.dependencyMap = dependencyMap;
    this.storageAdapter = storageAdapter;
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
    } else {
      throw new Error(`Content with id ${id} not found`);
    }
  }

  async deleteContent(id: ContentId): Promise<void> {
    if (this.dependencyMap.canDelete(id)) {
      this.itemMap.delete(id);
      this.dependencyMap.removeDependencies(id);
      await this.storageAdapter.deleteContent(id);
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
  
  async getAllDocuments(): Promise<Document[]> {
    return this.storageAdapter.getAllDocuments();
  }

  async getDocument(id: DocumentId): Promise<Document | undefined> {
    // First, check if the document is in the in-memory cache
    let document = this.documentCache.get(id);
    if (!document) {
      // If not in cache, load from storage
      document = await this.storageAdapter.loadDocument(id);
      if (document) {
        // Add to in-memory cache if found
        this.documentCache.set(id, document);
      }
    }
    return document;
  }

  async createDocument(title: string): Promise<Document> {
    const id = this.generateUniqueId();
    const rootBlockId = this.generateUniqueId();
    const now = new Date().toISOString();

    // Create the root block for the document
    const rootBlock: CompositeContent = {
      id: rootBlockId,
      modelInfo: {
        type: 'object',
        key: 'rootBlock',
        ref: "notion"
      },
      content: [],
      children: [],
    };

    // Create the document
    const document: Document = {
      id,
      title,
      rootBlock: rootBlockId,
      createdAt: now,
      updatedAt: now,
    };

    // Save the root block and the document
    await this.storageAdapter.saveContent(rootBlock);
    await this.storageAdapter.saveDocument(document);

    // Add to in-memory caches
    this.itemMap.set(rootBlockId, rootBlock);
    this.documentCache.set(id, document);

    return document;
  }

  async updateDocument(id: DocumentId, updater: (doc: Document) => Document): Promise<void> {
    const currentDocument = await this.getDocument(id);
    if (currentDocument) {
      const updatedDocument = updater(currentDocument);
      await this.storageAdapter.saveDocument(updatedDocument);
      this.documentCache.set(id, updatedDocument);
    } else {
      throw new Error(`Document with id ${id} not found`);
    }
  }

  async deleteDocument(id: DocumentId): Promise<void> {
    const document = await this.getDocument(id);
    if (document) {
      // Delete the root block and all its children recursively
      await this.deleteContentRecursive(document.rootBlock);

      // Delete the document itself
      await this.storageAdapter.deleteDocument(id);
      this.documentCache.delete(id);
    } else {
      throw new Error(`Document with id ${id} not found`);
    }
  }

  private async deleteContentRecursive(contentId: ContentId): Promise<void> {
    const content = await this.getContent(contentId);
    if (content && isCompositeContent(content)) {
      // Recursively delete all children
      for (const childId of content.children) {
        await this.deleteContentRecursive(childId);
      }
    }
    // Delete the content itself
    await this.deleteContent(contentId);
  }
}

// Create and export a singleton instance
export const contentStore = new ContentStore(
  new ContentItemMap(),
  new ContentDependencyMap(),
  new LocalStorageAdapter()
);
