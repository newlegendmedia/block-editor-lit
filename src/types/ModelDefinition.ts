// ModelDefinition.ts

// types/BlockInterfaces.ts
export interface BlockData {
  content: any;
  // Add other necessary properties
}

export interface SimplifiedModelDefinition {
  key: string;
  label: string;
  type: string;
  // Add other necessary properties
}

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
  properties?: Property[]; // Changed from 'items' to 'properties'
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