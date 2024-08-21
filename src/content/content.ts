export type ContentId = string;
export type DocumentId = string;
import {
	ModelType,
	Model,
} from '../model/model';

export interface Content<T = any> {
	id: ContentId;
	modelKey: string;
	modelRef?: string;
	inlineModel?: Model;
	type: ModelType;
	content: T;
}

export interface CompositeContent extends Content {
    type: 'group' | 'object' | 'array'; // Add your new type here
    children: string[];
    childrenType: 'keyed' | 'indexed';
}

export interface Document {
	id: DocumentId;
	title: string;
	rootBlock: ContentId;
}