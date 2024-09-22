// Basic types
type ContentId = string;
type ValueContent = string | number | boolean | null | Date;
type IndexedContent = ContentReference[];
type KeyedContent = { [key: string]: ContentReference };
type CompositeContent = IndexedContent | KeyedContent;

// Enum-like structure for content types
const ContentType = {
	Array: 'array',
	Group: 'group',
	Object: 'object',
	Element: 'element',
} as const;

type ContentType = (typeof ContentType)[keyof typeof ContentType];

interface ContentReference {
	id: ContentId;
	key: string;
	type: ContentType;
}

// Base interface for all content
interface BaseContent extends ContentReference {
	metadata?: Record<string, any>;
	config?: Record<string, any>;
}

// Full content interface
interface Content extends BaseContent {
	content?: ValueContent;
	children?: CompositeContent;
}

// Type guards for specific content types
function isArrayContent(content: Content): content is ArrayContent {
	return content.type === ContentType.Array;
}

function isGroupContent(content: Content): content is GroupContent {
	return content.type === ContentType.Group;
}

function isObjectContent(content: Content): content is ObjectContent {
	return content.type === ContentType.Object;
}

function isElementContent(content: Content): content is ElementContent {
	return content.type === ContentType.Element;
}

// Specific content type interfaces
interface ArrayContent extends Content {
	type: typeof ContentType.Array;
	children: IndexedContent;
}

interface GroupContent extends Content {
	type: typeof ContentType.Group;
	children: IndexedContent;
}

interface ObjectContent extends Content {
	type: typeof ContentType.Object;
	children: KeyedContent;
}

interface ElementContent extends Content {
	type: typeof ContentType.Element;
	content: ValueContent;
}

// Fully loaded content type (for when all children are loaded)
type FullContent = Content & {
	children?: FullContent[];
};

// Utility type if needed
type ContentWithoutId = Omit<Content, 'id'>;
