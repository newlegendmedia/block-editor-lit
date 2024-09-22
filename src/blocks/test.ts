//
// Model Defintions
export type ModelType = 'element' | 'object' | 'array' | 'group' | 'root';

export const AtomType = {
	Boolean: 'boolean',
	Text: 'text',
	Number: 'number',
	Datetime: 'datetime',
	Enum: 'enum',
	File: 'file',
	Reference: 'reference',
} as const;

export type AtomType = (typeof AtomType)[keyof typeof AtomType];

export type ModelId = string;

export interface BaseModel {
	id?: ModelId;
	type: ModelType;
	key: string;
	name?: string;
	path?: string;
	config?: Record<string, Model>;
	metadata?: Record<string, Model>;
	required?: boolean;
}

export interface BaseCompositeModel extends BaseModel {
	inlineChildren?: boolean;
}

export interface ElementModel extends BaseModel {
	type: 'element';
	base: AtomType;
}

export interface ObjectModel extends BaseCompositeModel {
	type: 'object';
	properties: Model[];
}

export interface ArrayModel extends BaseCompositeModel {
	type: 'array';
	itemType: Model | ModelReference;
	repeatable?: boolean;
}

export interface GroupModel extends BaseCompositeModel {
	type: 'group';
	itemTypes: (Model | ModelReference)[] | ModelReference;
	editable?: boolean;
}

export type ModelReference = BaseModel & {
	ref?: string; // Make ref optional
};

export type Model = ElementModel | ObjectModel | ArrayModel | GroupModel | ModelReference;

export type CompositeModel = ObjectModel | ArrayModel | GroupModel;

//
// Content Type Definitions
type ContentId = string;
type ValueContent = string | number | boolean | null;
type IndexedContent = Content[];
type KeyedContent = { [key: string]: Content };

interface Content {
	id: ContentId;
	key: string;
	type: 'array' | 'group' | 'object' | 'element';
	content?: IndexedContent | KeyedContent | ValueContent;
	children?: IndexedContent | KeyedContent;
}

interface ArrayContent extends Content {
	type: 'array';
	children: IndexedContent;
}

interface GroupContent extends Content {
	type: 'group';
	children: IndexedContent;
}

interface ObjectContent extends Content {
	type: 'object';
	children: KeyedContent;
}

interface ElementContent extends Content {
	type: 'element';
	content: ValueContent;
}

//
// Example Content
const sampleContent: KeyedContent = {
	arr: {
		id: 'ARR-1726934676612-6',
		type: 'array',
		key: 'sections',
		children: [
			{
				id: 'OBJ-1726934822793-25',
				type: 'object',
				key: 'section',
			},
			{
				id: 'OBJ-1726934827955-30',
				type: 'object',
				key: 'section',
			},
		],
	},
	section1: {
		id: 'OBJ-1726934822793-25',
		type: 'object',
		key: 'section',
		children: {
			heading: {
				id: 'ELE-1726934822797-27',
				type: 'element',
				key: 'heading',
			},
			body: {
				id: 'ELE-1726934822797-29',
				type: 'element',
				key: 'body',
			},
		},
	},
	section2: {
		id: 'OBJ-1726934822793-30',
		type: 'object',
		key: 'section',
		children: {
			heading: {
				id: 'ELE-1726934822797-98',
				type: 'element',
				key: 'heading',
			},
			body: {
				id: 'ELE-1726934822797-99',
				type: 'element',
				key: 'body',
			},
		},
	},
	heading1: {
		id: 'ELE-1726934822797-27',
		type: 'element',
		key: 'heading',
		content: 'Section 1',
	},
	body1: {
		id: 'ELE-1726934822797-29',
		type: 'element',
		key: 'body',
		content: 'This is the body of section 1',
	},
	heading2: {
		id: 'ELE-1726934822797-98',
		type: 'element',
		key: 'heading',
		content: 'Section 2',
	},
	body2: {
		id: 'ELE-1726934822797-99',
		type: 'element',
		key: 'body',
		content: 'This is the body of section 2',
	},
};
