import { Document, DocumentId, ContentId } from '../content/content';
import { contentStore } from '../content/ContentStore';
import { generateId } from '../util/generateId';
import { modelStore } from '../model/ModelStore';
import { ModelType } from '../model/model';
import { ContentPath } from '../content/ContentPath';

export class DocumentManager {
	private documents: Map<DocumentId, Document> = new Map();

	async createDocument(
		title: string = 'Untitled',
		modelKey: string = 'page',
		modelType: ModelType = 'group'
	): Promise<Document> {
		const model = await modelStore.getModel(modelKey, modelType);

		if (!model) {
			throw new Error(`${modelKey} model not found`);
		}

		const documentId = generateId('DOC') as DocumentId;
		const rootContentPath = ContentPath.fromDocumentId(documentId, modelKey);
		const rootContent = await contentStore.getOrCreateByPath(rootContentPath.path, model);

		const document: Document = {
			id: documentId,
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
