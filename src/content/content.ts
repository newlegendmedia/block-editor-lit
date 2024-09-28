import { ModelType } from '../model/model';

export type ContentId = string;
export type DocumentId = string;

export type ModelInfo = {
	type: ModelType;
	key: string;
	ref?: string;
};

//
// Content Types
//
export type Content<T = unknown> = {
	id: ContentId;
	modelInfo: ModelInfo;
	content: T;
	children?: KeyedCompositeChildren | IndexedCompositeChildren;
};

export interface ContentReference {
	id: ContentId;
	key: string;
	type: ModelType;
}

export interface Document {
	id: DocumentId;
	title: string;
	rootContent: ContentId;
	createdAt: string;
	updatedAt: string;
	isActive: boolean;
}

//
// Composite content types
//
export type CompositeContent = Content<KeyedCompositeContent | IndexedCompositeContent> & {
	children: KeyedCompositeChildren | IndexedCompositeChildren;
};

export type KeyedCompositeContent = {
	[key: string]: ContentId;
};

export type KeyedCompositeChildren = {
	[key: string]: ContentReference;
};

export type IndexedCompositeContent = ContentId[];

export type IndexedCompositeChildren = ContentReference[];

export type IndexedContent<T = unknown> = {
	id: ContentId;
	modelInfo: ModelInfo;
	content: T;
	children: IndexedCompositeChildren;
};

//
// Block Type Specific content types
//
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


//
// Type Guards
//
export function isContentReference(obj: any): obj is ContentReference {
	return (
		typeof obj === 'object' &&
		obj !== null &&
		'id' in obj &&
		typeof obj.id === 'string' &&
		'key' in obj &&
		typeof obj.key === 'string' &&
		'type' in obj &&
		isModelType(obj.type) &&
		Object.keys(obj).length === 3
	);
}

function isModelType(type: any): type is ModelType {
	return ['element', 'object', 'array', 'group', 'root'].includes(type);
}

// Additional type guard for full Content objects
export function isFullContent(obj: any): obj is Content {
	return (
		typeof obj === 'object' && obj !== null && 'id' in obj && 'modelInfo' in obj && 'content' in obj
	);
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
