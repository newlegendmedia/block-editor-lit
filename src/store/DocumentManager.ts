// documentManager.ts

import { contentStore } from '../store';
import { Content, Document, DocumentId } from '../content/content';
import { ObjectModel } from '../model/model';
import { ContentFactory } from '../store/ContentFactory';
import { libraryStore } from '../model/libraryStore';
import { generateId } from '../util/generateId';

export class DocumentManager {
	private documents: Map<DocumentId, Document> = new Map();

	constructor(private modelLibrary = libraryStore.value) {}

	async createDocument(title: string, docModelKey: string = 'documentRoot'): Promise<Document> {
		// Get the doc model
		let docModel = this.modelLibrary.getDefinition(docModelKey, 'object');
		if (!docModel) {
			throw new Error(`Document model not found: ${docModelKey}`);
		}

		// Create the document default content
		const { modelInfo, modelDefinition, content } = ContentFactory.createContentFromModel(
			docModel as ObjectModel
		);

		// Save the doc content
		const rootContent = await contentStore.createContent(modelInfo, modelDefinition, content);
		if (!rootContent) {
			throw new Error(`Error creating document content for model: ${docModelKey}`);
		}

		// Create the document using the ID of the newly created content
		const now = new Date().toISOString();
		const document: Document = {
			id: generateId('DOC'),
			title,
			rootContent: rootContent.id,
			createdAt: now,
			updatedAt: now,
			isActive: false,
		};

		// Save the document in the DocumentManager
		this.documents.set(document.id, document);

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
}
