import { ModelType, Model } from "../model/model";

export type ContentId = string;
export type DocumentId = string;

export type ModelInfo = {
  type: ModelType;
  key: string;
  ref?: string;
};

// export type KeyedCompositeContent = {
//     [key: string]: ContentId;
// };

export type IndexedCompositeContent = ContentId[];

// export type Content<T = unknown> = {
//     id: ContentId;
//     modelInfo: ModelInfo;
//     modelDefinition?: Model,
//     content: T | KeyedCompositeContent | IndexedCompositeContent;
// };

export type Content<T = unknown> = {
  id: ContentId;
  modelInfo: ModelInfo;
  modelDefinition?: Model;
  content: T;
};

export type CompositeContent = Content<
  KeyedCompositeContent | IndexedCompositeContent
> & {
  children: ContentId[];
};

// export type CompositeContent = Content<string> & {
//     children: ContentId[];
//   };

export type KeyedCompositeContent = {
  [key: string]: string;
};

export type ElementContent = Content<any>;

// export type CompositeContent = Content<KeyedCompositeContent | IndexedCompositeContent> & {
//     children: ContentId[];
// };

export type ObjectContent = CompositeContent & {
  content: KeyedCompositeContent;
};

export type ArrayContent = CompositeContent & {
  content: IndexedCompositeContent;
};

export type GroupContent = CompositeContent & {
  content: IndexedCompositeContent;
};

export interface Document {
  id: DocumentId;
  title: string;
  rootContent: ContentId;
  createdAt: string;
  updatedAt: string;
  isActive: boolean; // Added this property
}

export function isCompositeContent(
  content: Content,
): content is CompositeContent {
  return Array.isArray((content as CompositeContent).children);
}

export function isObjectContent(content: Content): content is ObjectContent {
  return (
    isCompositeContent(content) &&
    typeof content.content === "object" &&
    !Array.isArray(content.content)
  );
}

export function isKeyedCompositeContent(
  content: Content,
): content is ObjectContent {
  return (
    isCompositeContent(content) &&
    typeof content.content === "object" &&
    !Array.isArray(content.content)
  );
}

export function isIndexedCompositeContent(
  content: Content,
): content is ArrayContent {
  return isCompositeContent(content) && Array.isArray(content.content);
}

export function isArrayContent(content: Content): content is ArrayContent {
  return isCompositeContent(content) && Array.isArray(content.content);
}

export function isGroupContent(content: Content): content is GroupContent {
  return isCompositeContent(content) && Array.isArray(content.content);
}
