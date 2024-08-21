export type BlockId = string;
export type DocumentId = string;
import {
	PropertyType,
	Property,
	isElement,
	isObject,
	isArray,
	isGroup,
	AtomType,
} from '../util/model';

export interface ContentBlock<T = any> {
	id: BlockId;
	modelKey: string;
	modelRef?: string;
	inlineModel?: Property;
	type: PropertyType;
	content: T;
}

export interface CompositeBlock extends ContentBlock {
    type: 'group' | 'object' | 'array'; // Add your new type here
    children: string[];
    childrenType: 'keyed' | 'indexed';
}

export interface Document {
	id: DocumentId;
	title: string;
	rootBlock: BlockId;
}

export class BlockStore {
	private blocks: Map<BlockId, ContentBlock> = new Map();
	private documents: Map<DocumentId, Document> = new Map();
	private subscribers: Map<BlockId, Set<(block: ContentBlock) => void>> = new Map();
	private allBlocksSubscribers: Set<() => void> = new Set();

	// Block methods
	getBlock<T>(id: BlockId): ContentBlock<T> | undefined {
		return this.blocks.get(id) as ContentBlock<T> | undefined;
	}

	setBlock<T>(block: ContentBlock<T>): void {
		this.blocks.set(block.id, block);
		this.notifySubscribers(block.id);
	}

	updateBlock<T>(id: BlockId, updater: (block: ContentBlock<T>) => ContentBlock<T>): void {
		const block = this.blocks.get(id) as ContentBlock<T> | undefined;
		if (block) {
			const updatedBlock = updater(block);
			this.blocks.set(id, updatedBlock);
			this.notifySubscribers(id);
		}
	}

	deleteBlock(id: BlockId): void {
		this.blocks.delete(id);
		this.notifySubscribers(id);
	}

	// Document methods
	getDocument(id: DocumentId): Document | undefined {
		return this.documents.get(id);
	}

	setDocument(document: Document): void {
		this.documents.set(document.id, document);
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
	subscribeToBlock(id: BlockId, callback: (block: ContentBlock) => void): () => void {
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
	
	  getAllBlocks(): [BlockId, ContentBlock][] {
		return Array.from(this.blocks.entries());
	  }

	  private notifySubscribers(id: BlockId): void {
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

	getDefaultContent(property: Property): any {
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

	createBlockFromModel<T>(model: Property, content?: T): ContentBlock<T> {
		const id = this.generateUniqueId();
		const block: ContentBlock<T> = {
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

// Create a singleton instance of the BlockStore
export const blockStore = new BlockStore();
