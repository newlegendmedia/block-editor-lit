// ModelDefinition.ts
// ModelDefinition.ts

export interface IBaseProperty {
  id?: string;
  key: string;
  label?: string;
  config?: {
    [key: string]: any;  // Allows for arbitrary configuration objects
  };
}

export interface IElementProperty extends IBaseProperty {
  type: 'element';
  atom?: AtomType;
  ref?: string;
}

export interface IModelProperty extends IBaseProperty {
  type: 'model';
  properties?: Property[];
  ref?: string;
}

export interface IListProperty extends IBaseProperty {
  type: 'list';
  items: Property;
}

export interface IGroupProperty extends IBaseProperty {
  type: 'group';
  items: Property[];
  containerType?: 'section' | 'toggle' | 'tabs' | 'accordion' | 'custom';
  containerConfig?: {
    [key: string]: any;
  };
}

export type Property = IElementProperty | IModelProperty | IListProperty | IGroupProperty;

export enum AtomType {
  Boolean = 'boolean',
  Text = 'text',
  Number = 'number',
  Datetime = 'datetime',
  Enum = 'enum',
  File = 'file',
  Reference = 'reference'
}

export interface ModelDefinition extends IModelProperty {
  key: string;
  label: string;
  type: 'model';
  properties: Property[];
}

// Type guard functions
export function isElement(property: Property): property is IElementProperty {
  return property.type === 'element';
}

export function isModel(property: Property): property is IModelProperty {
  return property.type === 'model';
}

export function isList(property: Property): property is IListProperty {
  return property.type === 'list';
}

export function isGroup(property: Property): property is IGroupProperty {
  return property.type === 'group';
}

export function isModelDefinition(property: Property): property is ModelDefinition {
  return isModel(property) && 'key' in property && 'label' in property;
}


// You might also want to add a type for the entire model library
export interface ModelLibrary {
  getModel(ref: string): ModelDefinition | undefined;
}

// And a type for the element library if you're using one
export interface ElementLibrary {
  getElement(ref: string): IElementProperty | undefined;
}


// Example model definitions

export const personModel: ModelDefinition = {
  key: 'person',
  label: 'Person',
  type: 'model',
  properties: [
    {
      type: 'model',
      key: 'name',
      label: 'Full Name',
      properties: [
        { type: 'element', key: 'firstName', label: 'First Name', atom: AtomType.Text },
        { type: 'element', key: 'lastName', label: 'Last Name', atom: AtomType.Text }
      ]
    },
    {
      type: 'model',
      key: 'contactInfo',
      label: 'Contact Information',
      properties: [
        { 
          type: 'element', 
          key: 'email', 
          label: 'Email Address', 
          atom: AtomType.Text,
          config: {
            validation: {
              pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
            }
          }
        },
        { 
          type: 'element', 
          key: 'phone', 
          label: 'Phone Number', 
          atom: AtomType.Text,
          config: {
            validation: {
              pattern: '^\\+?[1-9]\\d{1,14}$'
            }
          }
        }
      ]
    },
    {
      type: 'element',
      key: 'maritalStatus',
      label: 'Marital Status',
      atom: AtomType.Enum,
      config: {
        options: [
          { value: 'single', label: 'Single' },
          { value: 'married', label: 'Married' },
          { value: 'divorced', label: 'Divorced' },
          { value: 'widowed', label: 'Widowed' },
          { value: 'separated', label: 'Separated' }
        ]
      }
    },
    {
      type: 'list',
      key: 'emergencyContacts',
      label: 'Emergency Contacts',
      items: {
        type: 'model',
        key: 'emergencyContact',
        ref: 'emergencyContact'
      }
    }
  ]
};

// New example using the group type
export const articleModel: ModelDefinition = {
  key: 'article',
  label: 'Article',
  type: 'model',
  properties: [
    {
      type: 'element',
      key: 'title',
      label: 'Article Title',
      atom: AtomType.Text
    },
    {
      type: 'group',
      key: 'content',
      label: 'Article Content',
      containerType: 'section',
      containerConfig: {
        className: 'article-body'
      },
      items: [
        {
          type: 'element',
          key: 'introduction',
          label: 'Introduction',
          atom: AtomType.Text
        },
        {
          type: 'group',
          key: 'mainContent',
          label: 'Main Content',
          containerType: 'tabs',
          containerConfig: {
            defaultTab: 'text'
          },
          items: [
            {
              type: 'group',
              key: 'text',
              label: 'Text Content',
              items: [
                {
                  type: 'element',
                  key: 'body',
                  label: 'Article Body',
                  atom: AtomType.Text
                }
              ]
            },
            {
              type: 'group',
              key: 'media',
              label: 'Media Content',
              items: [
                {
                  type: 'list',
                  key: 'images',
                  label: 'Image Gallery',
                  items: {
                    type: 'element',
                    key: 'image',
                    label: 'Image',
                    atom: AtomType.File
                  }
                }
              ]
            }
          ]
        },
        {
          type: 'group',
          key: 'conclusion',
          label: 'Conclusion',
          containerType: 'toggle',
          containerConfig: {
            toggleText: 'Show Conclusion'
          },
          items: [
            {
              type: 'element',
              key: 'conclusionText',
              label: 'Concluding Remarks',
              atom: AtomType.Text
            }
          ]
        }
      ]
    },
    {
      type: 'element',
      key: 'author',
      label: 'Author',
      atom: AtomType.Reference,
      ref: 'person'
    }
  ]
};

export const samplePersonData = {
  "name": {
    "firstName": "Alex",
    "lastName": "Johnson"
  },
  "contactInfo": {
    "email": "alex.johnson@example.com",
    "phone": "+1234567890"
  },
  "maritalStatus": "married",
  "emergencyContacts": [
    {
      "name": "Sarah Johnson",
      "phone": "+1987654321"
    },
    {
      "name": "Michael Smith",
      "phone": "+1122334455"
    }
  ]
};