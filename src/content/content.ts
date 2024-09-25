import { ModelType } from '../model/model';

export type ContentId = string;
export type DocumentId = string;

export type ModelInfo = {
	type: ModelType;
	key: string;
	ref?: string;
};

export type KeyedCompositeContent = {
	[key: string]: ContentId;
};

export type IndexedCompositeContent = ContentId[];

export interface ContentReference {
	id: ContentId;
	key: string;
	type: ModelType;
}

export type KeyedCompositeChildren = {
	[key: string]: ContentReference;
};

export type IndexedCompositeChildren = ContentReference[];

export type Content<T = unknown> = {
	id: ContentId;
	modelInfo: ModelInfo;
	content: T;
	children?: KeyedCompositeChildren | IndexedCompositeChildren;
};

export type IndexedContent<T = unknown> = {
	id: ContentId;
	modelInfo: ModelInfo;
	content: T;
	children: IndexedCompositeChildren;
};


export type CompositeContent = Content<KeyedCompositeContent | IndexedCompositeContent> & {
	children: KeyedCompositeChildren | IndexedCompositeChildren;
};

export type ElementContent = Content<any>;

export type ObjectContent = CompositeContent & {
	content: KeyedCompositeContent;
	children: KeyedCompositeChildren;
};

export type ArrayContent = CompositeContent & {
	content: IndexedCompositeContent;
	children: IndexedCompositeChildren;
};

export type GroupContent = CompositeContent & {
	content: IndexedCompositeContent;
	children: IndexedCompositeChildren;
};

export interface Document {
	id: DocumentId;
	title: string;
	rootContent: ContentId;
	createdAt: string;
	updatedAt: string;
	isActive: boolean;
}

export function isCompositeContent(content: Content): content is CompositeContent {
	return (
		'children' in content &&
		(Array.isArray(content.children) || typeof content.children === 'object')
	);
}

export function isObjectContent(content: Content): content is ObjectContent {
	return (
		isCompositeContent(content) &&
		typeof content.content === 'object' &&
		!Array.isArray(content.content) &&
		typeof content.children === 'object' &&
		!Array.isArray(content.children)
	);
}

export function isArrayContent(content: Content): content is ArrayContent {
	return (
		isCompositeContent(content) && Array.isArray(content.content) && Array.isArray(content.children)
	);
}

export function isGroupContent(content: Content): content is GroupContent {
	return (
		isCompositeContent(content) && Array.isArray(content.content) && Array.isArray(content.children)
	);
}

export function isKeyedCompositeContent(content: Content): content is ObjectContent {
	return (
		isCompositeContent(content) &&
		typeof content.content === 'object' &&
		!Array.isArray(content.content) &&
		typeof content.children === 'object' &&
		!Array.isArray(content.children)
	);
}

export function isIndexedCompositeContent(
	content: Content
): content is ArrayContent | GroupContent {
	return (
		isCompositeContent(content) && Array.isArray(content.content) && Array.isArray(content.children)
	);
}
