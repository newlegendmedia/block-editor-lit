// DocumentManager.ts

import { Document, DocumentId, CompositeContent } from '../content/content';
import { ContentStorageAdapter, LocalStorageAdapter } from './ContentStorageAdapter';

export class DocumentManager {
  private storageAdapter: ContentStorageAdapter;
  private documentCache: Map<DocumentId, Document> = new Map();

  constructor(storageAdapter: ContentStorageAdapter) {
    this.storageAdapter = storageAdapter;
  }

  async getAllDocuments(): Promise<Document[]> {
    return this.storageAdapter.getAllDocuments();
  }

  async getDocument(id: DocumentId): Promise<Document | undefined> {
    ;
    let document = this.documentCache.get(id);
    if (!document) {
      ;
      document = await this.storageAdapter.loadDocument(id);
      if (document) {
        this.documentCache.set(id, document);
        ;
      } else {
        ;
      }
    } else {
      ;
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
    await this.storageAdapter.deleteDocument(id);
    this.documentCache.delete(id);
  }

  private generateUniqueId(): string {
    return 'id_' + Math.random().toString(36).substr(2, 9);
  }
}

export const documentManager = new DocumentManager(new LocalStorageAdapter());