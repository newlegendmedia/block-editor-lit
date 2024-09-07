import { Document, DocumentId, ContentId } from '../content/content';
import { contentStore } from '../resourcestore';
import { libraryStore } from '../model/libraryStore';
import { generateId } from '../util/generateId';

class DocumentManager {
  private documents: Map<DocumentId, Document> = new Map();

  async createDocument(title: string): Promise<Document> {
    const modelStore = libraryStore.value;
    const notionModel = await modelStore.getDefinition('notion', 'object');
    if (!notionModel) {
      throw new Error('Notion model not found');
    }

    const rootContent = await contentStore.create(
      { type: 'object', key: 'notion' },
      notionModel,
      { title }
    );

    const document: Document = {
      id: generateId('DOC') as DocumentId,
      title,
      rootContent: rootContent.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: false,
    };

    this.documents.set(document.id, document);
    return document;
  }

  async getDocument(id: DocumentId): Promise<Document | undefined> {
    return this.documents.get(id);
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

  async closeDocument(id: DocumentId): Promise<void> {
    const document = this.documents.get(id);
    if (document) {
      await this.deactivateDocument(id);
      await contentStore.remove(document.rootContent);
    }
  }

  async deleteDocument(id: DocumentId): Promise<void> {
    const document = this.documents.get(id);
    if (document) {
      await this.deleteContentRecursively(document.rootContent);
      this.documents.delete(id);
    }
  }

  private async deleteContentRecursively(contentId: ContentId): Promise<void> {
    const content = await contentStore.get(contentId);
    if (content) {
      if ('children' in content && Array.isArray(content.children)) {
        for (const childId of content.children) {
          await this.deleteContentRecursively(childId);
        }
      }
      await contentStore.delete(contentId);
    }
  }
}

export const documentManager = new DocumentManager();