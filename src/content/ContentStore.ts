import { Model } from '../model/model';
import { UniversalPath } from '../path/UniversalPath';
import { ResourceStore } from '../resource/ResourceStore';
import { IndexedDBAdapter } from '../storage/IndexedDBAdapter';
import { StorageAdapter } from '../storage/StorageAdapter';
import { generateId } from '../util/generateId';
import { Content, ContentId } from './content';
import { ContentFactory } from './ContentFactory';

export class ContentStore extends ResourceStore<Content> {
	pathMap: Map<string, ContentId> = new Map();
	private rootContentId: ContentId = 'root' as ContentId;

	constructor(storageAdapter: StorageAdapter<string, Content>) {
		const rootContent: Content = {
			id: 'root' as ContentId,
			type: 'root',
			key: 'root',
			parentId: 'root',
			children: [],
			content: {},
		};
		super(storageAdapter, 'root' as ContentId, rootContent);
	}

	async getOrCreateByPath(path: string, model: Model): Promise<Content> {
		let content = await this.getByPath(path);
		if (!content) {
			const defaultContent = ContentFactory.createContentFromModel(model);
			content = {
				id: generateId(model.type ? model.type.slice(0, 3).toUpperCase() : '') as ContentId,
				...defaultContent,
			};
			const uPath = UniversalPath.fromFullPath(path);
			const uParentPath = UniversalPath.fromFullPath(uPath.contentParent);
			const parentPath = uParentPath.isDocumentRoot() ? this.rootContentId : uParentPath.toString();
			content = await this.add(content, parentPath, path);
		}
		return content;
	}
}

// Create a singleton instance of IndexedDBAdapter
const storageAdapter = new IndexedDBAdapter<Content>('content-store', 1);

// Create a singleton instance of ContentStore
export const contentStore = new ContentStore(storageAdapter);
