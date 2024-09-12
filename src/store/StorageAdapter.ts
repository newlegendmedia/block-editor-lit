// storageAdapter.ts
import { Content, ContentId } from "../content/content";

export interface StorageAdapter {
  loadContent(id: ContentId): Promise<Content | undefined>;
  saveContent(content: Content): Promise<void>;
  deleteContent(id: ContentId): Promise<void>;
  batchSaveContent(contents: Content[]): Promise<void>;
  batchDeleteContent(ids: ContentId[]): Promise<void>;
  clearAllData(): Promise<void>;
}
