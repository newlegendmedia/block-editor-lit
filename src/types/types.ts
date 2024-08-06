import { Tree } from '../tree/Tree';
import {
  IBaseProperty,
  IElementProperty,
  IModelProperty,
  IListProperty,
  IGroupProperty,
  Property,
  ModelDefinition
} from './ModelDefinition';

// duplicated from ModelDefinition.ts
export enum AtomType {
  Boolean = 'boolean',
  Text = 'text',
  Number = 'number',
  Datetime = 'datetime',
  Enum = 'enum',
  File = 'file',
  Reference = 'reference'
}

export interface TreeItem {
  id: string;
  key: string;
  [key: string]: any;
}

export interface BlockItem extends TreeItem {
  title: string;
  content: string;
}


export type Atom = AtomType;

// Use IModelProperty from ModelDefinition.ts instead of the local ModelItem
export type ModelItem = IModelProperty;

// Use Property from ModelDefinition.ts instead of the local ModelProperty
export type ModelProperty = Property;

export interface TreeNode<K, Item> {
  id: K;
  item: Item;
  parentId: K | null;
  children: TreeNode<K, Item>[];
  tree: Tree<K, Item> | null;
  addChild(child: TreeNode<K, Item>, afterChildId?: K): TreeNode<K, Item> | undefined;
  removeChild(childId: K): void;
}

// Re-export types from ModelDefinition.ts for easier access
export type {
  IBaseProperty,
  IElementProperty,
  IModelProperty,
  IListProperty,
  IGroupProperty,
  Property,
  ModelDefinition
};

// Add any additional types that are specific to your new prototype and not covered by ModelDefinition.ts