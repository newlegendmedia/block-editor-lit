// documentManager.ts

import { contentStore } from '../store';
import { Content, Document, DocumentId, CompositeContent } from '../content/content';
import { ObjectModel } from '../model/model';
import { ContentFactory } from '../store/ContentFactory';
import { libraryStore } from '../model/libraryStore';

export class DocumentManager {
  private documents: Map<DocumentId, Document> = new Map();

  constructor(
    private modelLibrary = libraryStore.value
  ) {}

  async createDocument(title: string, rootModelKey: string = 'documentRoot'): Promise<Document> {
    const documentId = this.generateUniqueId();
    const now = new Date().toISOString();
    console.log(`[DocumentManager] Creating document with title: ${title}, rootModelKey: ${rootModelKey} and ID: ${documentId}`);

    // Get the root model from the ModelLibrary
    let rootModel = this.modelLibrary.getDefinition(rootModelKey, 'object');
    if (!rootModel || rootModel.type !== 'object') {
      throw new Error(`Invalid root model: ${rootModelKey}`);
    }

    // Use ContentFactory to create the content
    const { modelInfo, modelDefinition, content } = ContentFactory.createContentFromModel<CompositeContent>(rootModel as ObjectModel);
    console.log(`[DocumentManager] Created initial content:`, content);

    // Create and save the root content using ContentStore
    const rootContent = await contentStore.createContent(modelInfo, modelDefinition, content);
    console.log(`[DocumentManager] Saved root content:`, rootContent);

    // Create the document using the ID of the newly created content
    const document: Document = {
      id: documentId,
      title,
      rootContent: rootContent.id,
      createdAt: now,
      updatedAt: now,
      isActive: false,
    };

    // Save the document in the DocumentManager
    this.documents.set(document.id, document);

    console.log(`[DocumentManager] Created document:`, document);
    return document;
  }

  async getDocument(id: DocumentId): Promise<Document | undefined> {
    return this.documents.get(id) || undefined;
  }

  async updateDocument(id: DocumentId, updates: Partial<Document>): Promise<Document | undefined> {
    const document = this.documents.get(id);
    if (!document) return undefined;

    const updatedDocument = { ...document, ...updates, updatedAt: new Date().toISOString() };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  async deleteDocument(id: DocumentId): Promise<void> {
    const document = this.documents.get(id);
    if (!document) return;

    await contentStore.deleteContent(document.rootContent);
    this.documents.delete(id);
  }

  async getDocumentContent(documentId: DocumentId): Promise<Content | undefined> {
    const document = this.documents.get(documentId);
    if (!document) return undefined;

    return contentStore.getContent(document.rootContent);
  }

  async getAllDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }

  async activateDocument(id: DocumentId): Promise<void> {
    const document = this.documents.get(id);
    if (document) {
      document.isActive = true;
      this.documents.set(id, document);
    }
  }

  async deactivateDocument(id: DocumentId): Promise<void> {
    const document = this.documents.get(id);
    if (document) {
      document.isActive = false;
      this.documents.set(id, document);
    }
  }

  private generateUniqueId(): DocumentId {
    return 'doc_' + Math.random().toString(36).substr(2, 9);
  }
}