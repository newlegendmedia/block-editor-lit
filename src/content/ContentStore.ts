
import { AtomType, Model } from '../model/model';
import { ContentId, DocumentId, Content, Document } from './content';
import { isArray, isElement, isGroup, isObject } from '../model/model';

export class ContentStore {
	private blocks: Map<ContentId, Content> = new Map();
	private documents: Map<DocumentId, Document> = new Map();
	private subscribers: Map<ContentId, Set<(block: Content) => void>> = new Map();
	private allBlocksSubscribers: Set<() => void> = new Set();

	// Block methods
	getBlock<T>(id: ContentId): Content<T> | undefined {
		return this.blocks.get(id) as Content<T> | undefined;
	}

	setBlock<T>(block: Content<T>): void {
		this.blocks.set(block.id, block);
		this.notifySubscribers(block.id);
	}

	updateBlock<T>(id: ContentId, updater: (block: Content<T>) => Content<T>): void {
		const block = this.blocks.get(id) as Content<T> | undefined;
		if (block) {
			const updatedBlock = updater(block);
			this.blocks.set(id, updatedBlock);
			this.notifySubscribers(id);
		}
	}

	deleteBlock(id: ContentId): void {
		this.blocks.delete(id);
		this.notifySubscribers(id);
	}

	// Document methods
	getDocument(id: DocumentId): Document | undefined {
		return this.documents.get(id);
	}

	setDocument(newDocument: Document): void {
		this.documents.set(newDocument.id, newDocument);
	}

	updateDocument(id: DocumentId, updater: (doc: Document) => Document): void {
		const doc = this.documents.get(id);
		if (doc) {
			const updatedDoc = updater(doc);
			this.documents.set(id, updatedDoc);
		}
	}

	deleteDocument(id: DocumentId): void {
		this.documents.delete(id);
	}

	// Subscription methods
	subscribeToBlock(id: ContentId, callback: (block: Content) => void): () => void {
		if (!this.subscribers.has(id)) {
			this.subscribers.set(id, new Set());
		}
		this.subscribers.get(id)!.add(callback);

		const block = this.blocks.get(id);
		if (block) {
			callback(block);
		}

		return () => {
			const blockSubscribers = this.subscribers.get(id);
			if (blockSubscribers) {
				blockSubscribers.delete(callback);
				if (blockSubscribers.size === 0) {
					this.subscribers.delete(id);
				}
			}
		};
	}

	subscribeToAllBlocks(callback: () => void): () => void {
		this.allBlocksSubscribers.add(callback);
		return () => {
		  this.allBlocksSubscribers.delete(callback);
		};
	  }
	
	  getAllBlocks(): [ContentId, Content][] {
		return Array.from(this.blocks.entries());
	  }

	  private notifySubscribers(id: ContentId): void {
		const block = this.blocks.get(id);
		if (block) {
		  // Notify subscribers for this specific block
		  const subscribers = this.subscribers.get(id);
		  if (subscribers) {
			subscribers.forEach((callback) => callback(block));
		  }
		}
	
		// Notify subscribers for all blocks
		this.allBlocksSubscribers.forEach(callback => callback());
	  }
	
	private generateUniqueId(): string {
		return 'id_' + Math.random().toString(36).slice(2, 11);
	}

	getDefaultContent(property: Model): any {
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

	createBlockFromModel<T>(model: Model, content?: T): Content<T> {
		const id = this.generateUniqueId();
		const block: Content<T> = {
			id,
			modelKey: model.key || '',
			modelRef: 'ref' in model ? model.ref : undefined,
			inlineModel: 'ref' in model ? undefined : model, // Add this line
			type: model.type,
			content: content ?? (this.getDefaultContent(model) as T),
		};
		this.setBlock(block);
		return block;
	}
}

// Create a singleton instance of the ContentStore
export const contentStore = new ContentStore();
