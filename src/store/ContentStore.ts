import { Content, ContentId, ModelInfo } from '../content/content';
import { StorageAdapter } from './StorageAdapter';
import { Model } from '../model/model';
import { SubscriptionManager } from './SubscriptionManager';
import { ContentTree } from './ContentTree';

// class ContentError extends Error {
//   constructor(message: string) {
//     super(message);
//     this.name = 'ContentError';
//   }
// }

// export interface ContentStore {
//   getContent<T = unknown>(id: ContentId): Promise<Content<T>>;
//   createContent<T = unknown>(modelInfo: ModelInfo, modelDefinition: Model | undefined, content: T): Promise<Content<T>>;
//   updateContent<T = unknown>(id: ContentId, updater: (content: Content<T>) => Content<T>): Promise<Content<T>>;
//   deleteContent(id: ContentId): Promise<void>;
//   subscribeToContent(id: ContentId, callback: (content: Content | null) => void): () => void;
//   subscribeToAllContent(callback: () => void): () => void;
// }

export class ContentStore {
  private contentTree: ContentTree;
  private storageAdapter: StorageAdapter;
  private subscriptionManager: SubscriptionManager;

  constructor(storageAdapter: StorageAdapter) {
    this.contentTree = new ContentTree();
    this.storageAdapter = storageAdapter;
    this.subscriptionManager = new SubscriptionManager();
  }

  async getContent<T = unknown>(id: ContentId): Promise<Content<T> | undefined> {
    let content = this.contentTree.getContentById(id) as Content<T> | undefined;
    if (!content) {
      content = await this.storageAdapter.loadContent(id) as Content<T> | undefined;
      if (content) {
        this.contentTree.addContent(content);
      }
    }
    return content;
  }

  async createContent<T = unknown>(modelInfo: ModelInfo, modelDefinition: Model | undefined, content: T): Promise<Content<T>> {
    const id = this.generateUniqueId();
    const newContent: Content<T> = {
      id,
      modelInfo,
      modelDefinition,
      content
    };

    const existingContent = await this.getContent(id);
    if (existingContent) {
      console.warn(`Content with id ${id} already exists. Updating instead of creating.`);
      return this.updateContent(id, () => newContent);
    }

    try {
      await this.storageAdapter.saveContent(newContent);
    } catch (error) {
      console.error('Error saving content:', error);
      throw error;
    }

    this.contentTree.addContent(newContent);
    this.subscriptionManager.notifyContentChange(id, newContent);

    return newContent;
  }

  async updateContent<T = unknown>(id: ContentId, updater: (content: Content<T>) => Content<T>): Promise<Content<T>> {
    const existingContent = await this.getContent<T>(id);
    if (!existingContent) {
      throw new Error(`Content with id ${id} not found`);
    }
  
    const updatedContent = updater(existingContent);
    
    await this.storageAdapter.saveContent(updatedContent);
    this.contentTree.updateContent(updatedContent);
    this.subscriptionManager.notifyContentChange(id, updatedContent);
  
    return updatedContent;
  }

  async deleteContent(_id: ContentId): Promise<void> {
//    const content = await this.getContent(id);
//    this.contentTree.removeContent(id);

    // if (!this.contentTree.isContentShared(id)) {
    //   if (isCompositeContent(content as CompositeContent)) {
    //     await this.deleteCompositeContent(content as CompositeContent);
    //   }
    //   await this.storageAdapter.deleteContent(id);
    //   this.subscriptionManager.notifyContentChange(id, undefined);
    // }
  }
  subscribeToContent(id: ContentId, callback: (content: Content | undefined) => void): () => void {
    return this.subscriptionManager.subscribeToContent(id, callback);
  }

  subscribeToAllContent(callback: () => void): () => void {
    return this.subscriptionManager.subscribeToAllContent(callback);
  }

  // private async deleteCompositeContent(content: CompositeContent): Promise<void> {
  //   for (const childId of content.children) {
  //     await this.deleteContent(childId);
  //   }
  // }

  async getAllContent(): Promise<Content[]> {
    return this.contentTree.getAll();
  }
  

  async getAllDocuments(): Promise<Document[]> {
    // This would return all documents, possibly from a separate DocumentStore
    // For now, we'll return an empty array
    return [];
  }
  
  private generateUniqueId(): ContentId {
    return 'id_' + Math.random().toString(36).substr(2, 9);
  }

  // private validateContent(modelDefinition: Model | undefined, content: unknown): void {
  //   if (!modelDefinition) {
  //     throw new ContentError('Model definition is required');
  //   }

  //   if (isCompositeModel(modelDefinition)) {
  //     // if (!isCompositeContent(content)) {
  //     //   console.log('Content not composite:', content, modelDefinition);
  //     //   throw new ContentError('Content does not match the composite model structure');
  //     // }
      
  //     // Validate that the content has the correct structure
  //     // if (!Array.isArray(content.children)) {
  //     //   throw new ContentError('Composite content must have a children array');
  //     // }
      
  //     // if (typeof content.content !== 'object' || content.content === null) {
  //     //   throw new ContentError('Composite content must have a content object');
  //     // }
      
  //     // You can add more specific validation for composite models here
  //   } else {
  //     // Add validation for non-composite models
  //     // This depends on your specific requirements for different model types
  //   }
  //   // Add more validation logic based on the model type and structure
  // }
}
