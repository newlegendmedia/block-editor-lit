import { Content, ContentId, Document, DocumentId } from '../content/content';

export interface ContentStorageAdapter {
  loadContent<T>(id: ContentId): Promise<Content<T> | undefined>;
  saveContent<T>(content: Content<T>): Promise<void>;
  deleteContent(id: ContentId): Promise<void>;
  getAllDocuments(): Promise<Document[]>;
  loadDocument(id: DocumentId): Promise<Document | undefined>;
  saveDocument(document: Document): Promise<void>;
  deleteDocument(id: DocumentId): Promise<void>;
}

export class LocalStorageAdapter implements ContentStorageAdapter {
  private contentPrefix: string;
  private documentPrefix: string;
  private documentListKey: string;

  constructor(contentPrefix: string = 'content_', documentPrefix: string = 'document_') {
    this.contentPrefix = contentPrefix;
    this.documentPrefix = documentPrefix;
    this.documentListKey = 'document_list';
  }

  // Existing methods for content
  async loadContent<T>(id: ContentId): Promise<Content<T> | undefined> {
    const item = localStorage.getItem(this.contentPrefix + id);
    return item ? JSON.parse(item) : undefined;
  }

  async saveContent<T>(content: Content<T>): Promise<void> {
    localStorage.setItem(this.contentPrefix + content.id, JSON.stringify(content));
  }

  async deleteContent(id: ContentId): Promise<void> {
    localStorage.removeItem(this.contentPrefix + id);
  }

  async getAllDocuments(): Promise<Document[]> {
    const documentList = localStorage.getItem(this.documentListKey);
    const documentIds = documentList ? JSON.parse(documentList) : [];
    const documents: Document[] = [];

    for (const id of documentIds) {
      const document = await this.loadDocument(id);
      if (document) {
        documents.push(document);
      }
    }

    return documents;
  }

  async loadDocument(id: DocumentId): Promise<Document | undefined> {
    const item = localStorage.getItem(this.documentPrefix + id);
    if (item) {
      const parsedItem = JSON.parse(item);
      // Ensure the loaded item conforms to the Document type
      if (this.isValidDocument(parsedItem)) {
        return parsedItem;
      }
    }
    return undefined;
  }

  async saveDocument(document: Document): Promise<void> {
    if (!this.isValidDocument(document)) {
      throw new Error('Invalid document structure');
    }
    localStorage.setItem(this.documentPrefix + document.id, JSON.stringify(document));

    // Update the document list
    const documentList = localStorage.getItem(this.documentListKey);
    const documentIds = documentList ? JSON.parse(documentList) : [];
    if (!documentIds.includes(document.id)) {
      documentIds.push(document.id);
      localStorage.setItem(this.documentListKey, JSON.stringify(documentIds));
    }
  }

  async deleteDocument(id: DocumentId): Promise<void> {
    localStorage.removeItem(this.documentPrefix + id);

    // Update the document list
    const documentList = localStorage.getItem(this.documentListKey);
    let documentIds = documentList ? JSON.parse(documentList) : [];
    documentIds = documentIds.filter((docId: string) => docId !== id);
    localStorage.setItem(this.documentListKey, JSON.stringify(documentIds));
  }

  private isValidDocument(obj: any): obj is Document {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      typeof obj.id === 'string' &&
      typeof obj.title === 'string' &&
      typeof obj.rootBlock === 'string' &&
      typeof obj.createdAt === 'string' &&
      typeof obj.updatedAt === 'string'
    );
  }
}
