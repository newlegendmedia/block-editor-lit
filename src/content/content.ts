export type ContentId = string;
export type DocumentId = string;
import {
	ModelType,
	CompositeType,
	Model,
} from '../model/model';

export interface ModelInfo {
    key: string;
	ref?: string;
    type: ModelType;
    childrenType?: CompositeType;
}
export interface Content<T = any> {
    id: ContentId;
    modelInfo: ModelInfo;
    modelDefinition?: Model;
    content: T;
}
export interface CompositeContent extends Content {
    modelInfo: ModelInfo & {
        type: 'group' | 'object' | 'array';
        childrenType: CompositeType;
    };
    children: string[];
}

export interface Document {
	id: DocumentId;
	title: string;
	rootBlock: ContentId;
}