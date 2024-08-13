import { ReactiveController, ReactiveControllerHost } from 'lit';
import { PathTree } from '../tree/PathTree';
import { PathTreeNode } from '../tree/PathTreeNode';
import {
  Property,
  ModelDefinition,
  isModel,
  isGroup,
  isElement,
  isList,
} from '../types/ModelDefinition';
import { ElementBlock, ModelBlock, ListBlock, GroupBlock } from '../blocks/BaseBlock';
import { BaseBlock } from '../blocks/BaseBlock';
import { ModelStateController } from './ModelStateController';
import { DocumentBlock } from '../blocks/DocumentBlock';
import { generateId } from '../util/generateId';
import { ContentDataTree } from '../tree/ContentDataTree';

export class TreeStateController implements ReactiveController {
  host: ReactiveControllerHost;
  private blockTree: PathTree<string, BaseBlock>;
  private contentTree: ContentDataTree;
  private modelStateController: ModelStateController;

  constructor(
    host: ReactiveControllerHost,
    modelDefinition: ModelDefinition,
    modelStateController: ModelStateController,
    initialContent?: any
  ) {
    this.host = host;
    this.modelStateController = modelStateController;

    // Create the root DocumentBlock
    const rootBlock = new DocumentBlock(modelDefinition, 'root', this, modelStateController);
    this.blockTree = new PathTree<string, BaseBlock>('root', rootBlock);
    this.contentTree = new ContentDataTree('root', initialContent || {});

    this.host.addController(this);
    this.initializeWithDocument(modelDefinition);
  }

  private initializeWithDocument(modelDefinition: ModelDefinition) {
    console.log('Initializing document structure');
    this.createChildBlocks(modelDefinition.properties, 'root');
    console.log('Block tree structure:', this.logTreeStructure());
    console.log(
      'Content tree structure:',
      JSON.stringify(this.contentTree.getValueByPath('root'), null, 2)
    );
  }
	
	// ReactiveController interface methods
	hostConnected(): void {
		// Perform any setup when the host element is connected
		console.log('TreeStateController: Host connected');
	}

	hostDisconnected(): void {
		// Perform any cleanup when the host element is disconnected
		console.log('TreeStateController: Host disconnected');
	}

	hostUpdate(): void {
		// Perform any updates before the host element updates
		console.log('TreeStateController: Host updating');
	}

	hostUpdated(): void {
		// Perform any actions after the host element has updated
		console.log('TreeStateController: Host updated');
	}

	// Add getBlock method
	getBlock(path: string): BaseBlock | undefined {
		const node = this.blockTree.getNodeByPath(path);
		if (node) {
			console.log(`Retrieved block for path: ${path}`, node.item);
			return node.item;
		}
		console.warn(`No block found for path: ${path}`);
		return undefined;
	}

	private createChildBlocks(properties: Property[], parentPath: string) {
		const parentNode = this.blockTree.getNodeByPath(parentPath);
		if (!parentNode) {
		  console.warn(`Parent node not found for path: ${parentPath}`);
		  return;
		}
	
		properties.forEach((prop) => {
		  const path = `${parentPath}.${prop.key}`;
		  console.log(`Creating block for path: ${path}`);
		  const block = this.createBlock(prop, path);
		  const addedNode = this.blockTree.add(block, parentNode.id, prop.key);
	
		  if (addedNode) {
			console.log(`Added block to tree: ${path}`);
			// Initialize content for the new block
			if (!this.contentTree.getValueByPath(path)) {
			  const defaultValue = this.getDefaultValueForProperty(prop);
			  this.contentTree.setValueByPath(path, defaultValue);
			  console.log(`Initialized content for ${path}:`, defaultValue);
			}
	
			if (isModel(prop) || isGroup(prop)) {
			  if (prop.properties) {
				this.createChildBlocks(prop.properties, path);
			  }
			} else if (isList(prop)) {
			  // For lists, we might want to initialize with some default items
			  const listContent = this.contentTree.getValueByPath(path) || [];
			  if (listContent.length === 0 && prop.items) {
				// Add a default item to the list
				this.addChildBlock(path, prop.items);
			  }
			}
		  } else {
			console.warn(`Failed to add block to tree: ${path}`);
		  }
		});
	
		// Log the children of the parent node after adding all child blocks
		if (parentNode) {
		  console.log(
			`Children of ${parentPath}:`,
			parentNode.children.map((child) => (child as PathTreeNode<string, BaseBlock>).id)
		  );
		}
	  }
	

	  private createBlock(property: Property, path: string): BaseBlock {
		if (isElement(property)) {
		  return new ElementBlock(property, path, this, this.modelStateController);
		} else if (isModel(property)) {
		  return new ModelBlock(property, path, this, this.modelStateController);
		} else if (isList(property)) {
		  return new ListBlock(property, path, this, this.modelStateController);
		} else if (isGroup(property)) {
		  return new GroupBlock(property, path, this, this.modelStateController);
		} else {
		  console.warn(`Unknown property type for ${path}. Defaulting to ElementBlock.`);
		  return new ElementBlock(property, path, this, this.modelStateController);
		}
	  }

	getChildBlocks(path: string): BaseBlock[] {
		const node = this.blockTree.getNodeByPath(path);
		const childBlocks = node
			? node.children.map((child) => (child as PathTreeNode<string, BaseBlock>).item)
			: [];
		console.log(
			`Getting child blocks for ${path}:`,
			childBlocks.map((b) => b.path)
		);
		return childBlocks;
	}

	addChildBlock(parentPath: string, childProperty: Property) {
		const parentNode = this.blockTree.getNodeByPath(parentPath);
		if (!parentNode) {
			console.warn(`Parent node not found for path: ${parentPath}`);
			return;
		}

		const newId = generateId() as string;
		const newPath = `${parentPath}.${newId}`;
		console.log(`Adding new child block: ${newPath}`);
		const newBlock = this.createBlock(childProperty, newPath);
		const addedNode = this.blockTree.add(newBlock, parentNode.id, newId);

		if (addedNode) {
			// Initialize content for the new block
			const defaultValue = this.getDefaultValueForProperty(childProperty);
			this.contentTree.setValueByPath(newPath, defaultValue);
			console.log(`Initialized content for new block ${newPath}:`, defaultValue);

			// Log the updated children of the parent node
			console.log(
				`Updated children of ${parentPath}:`,
				parentNode.children.map((child) => (child as any).id)
			);

			this.requestUpdate(`addChildBlock: ${newPath}`);
		} else {
			console.warn(`Failed to add child block at path: ${newPath}`);
		}
	}

	private getDefaultValueForProperty(property: Property): any {
		if (isElement(property)) {
		  return '';
		} else if (isList(property)) {
		  return [];
		} else if (isModel(property) || isGroup(property)) {
		  return {};
		}
		return null;
	  }

	getContentByPath(path: string): any {
		return this.contentTree.getValueByPath(path);
	}

	setContentByPath(path: string, content: any): void {
		this.contentTree.setValueByPath(path, content);
		this.requestUpdate(`setContentByPath: ${path}`);
	}

	private logTreeStructure(path: string = 'root', depth: number = 0): string {
		const node = this.blockTree.getNodeByPath(path);
		if (!node) return '';

		const indent = '  '.repeat(depth);
		let result = `${indent}${path} (${node.item.constructor.name})\n`;

		node.children.forEach((child) => {
			result += this.logTreeStructure(`${path}.${(child as any).id}`, depth + 1);
		});

		return result;
	}

	requestUpdate(reason: string) {
		console.log(`Update requested: ${reason}`);
		this.host.requestUpdate();
	}
}
