// enums.ts
export enum ModelTypeX {
	Element = 'Element',
	Object = 'Object',
	Array = 'Array',
	Group = 'Group',
	// Add other model types as needed
}

// brands.ts
type Brand<K, T> = K & { __brand: T };

export type ContentId = Brand<string, 'ContentId'>;
export type DocumentId = Brand<string, 'DocumentId'>;

// types.ts
//import { ModelType } from './enums';
//import { ContentId, DocumentId } from './brands';

/**
 * Contains metadata about the model associated with the content.
 */
export type ModelInfo = {
	type: ModelTypeX;
	key: string;
	ref?: string;
};

/**
 * Represents a reference to content.
 */
export interface ContentReference {
	id: ContentId;
	key: string;
	type: ModelTypeX;
}

/**
 * Represents a document containing content.
 */
export interface Document {
	id: DocumentId;
	title: string;
	rootContent: ContentId;
	createdAt: Date;
	updatedAt: Date;
	isActive: boolean;
}

/**
 * Base interface for all content types.
 */
export interface BaseContent {
	id: ContentId;
	modelInfo: ModelInfo;
	children: KeyedCompositeChildren | IndexedCompositeChildren;
}

/**
 * Represents keyed content (object structure).
 */
export interface ObjectContent extends BaseContent {
	content: KeyedCompositeContent;
	children: KeyedCompositeChildren;
}

/**
 * Represents indexed content (array structure).
 */
export interface ArrayContent extends BaseContent {
	content: IndexedCompositeContent;
	children: IndexedCompositeChildren;
}

/**
 * Represents group content (similar to array content).
 */
export interface GroupContent extends BaseContent {
	content: IndexedCompositeContent;
	children: IndexedCompositeChildren;
}

/**
 * Represents generic element content.
 */
export interface ElementContent extends BaseContent {
	content: any;
}

/**
 * Union type for all content variants.
 */
export type Content = ElementContent | ObjectContent | ArrayContent | GroupContent;

/**
 * Keyed composite content maps string keys to ContentIds.
 */
export interface KeyedCompositeContent {
	[key: string]: ContentId;
}

/**
 * Keyed composite children maps string keys to ContentReferences.
 */
export interface KeyedCompositeChildren {
	[key: string]: ContentReference;
}

/**
 * Indexed composite content is an array of ContentIds.
 */
export type IndexedCompositeContent = ContentId[];

/**
 * Indexed composite children is an array of ContentReferences.
 */
export type IndexedCompositeChildren = ContentReference[];

// typeGuards.ts
// import {
// 	Content,
// 	ModelType,
// 	ObjectContent,
// 	ArrayContent,
// 	GroupContent,
// 	ElementContent,
// } from './types';

/**
 * Type guard for ElementContent.
 */
export function isElementContent(content: Content): content is ElementContent {
	return content.modelInfo.type === ModelTypeX.Element;
}

/**
 * Type guard for ObjectContent.
 */
export function isObjectContent(content: Content): content is ObjectContent {
	return content.modelInfo.type === ModelTypeX.Object;
}

/**
 * Type guard for ArrayContent.
 */
export function isArrayContent(content: Content): content is ArrayContent {
	return content.modelInfo.type === ModelTypeX.Array;
}

/**
 * Type guard for GroupContent.
 */
export function isGroupContent(content: Content): content is GroupContent {
	return content.modelInfo.type === ModelTypeX.Group;
}
