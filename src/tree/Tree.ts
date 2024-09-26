// Tree.ts

import { TreeNode } from './TreeNode';
import { generateId } from '../util/generateId';
import { HierarchicalItem } from './HierarchicalItem';

export class Tree<K, Item> {
	private nodes: Map<K, TreeNode<K, Item>>;
	private root: TreeNode<K, Item>;

	constructor(rootId: K, rootItem?: Item) {
		this.nodes = new Map();
		if (!rootItem) rootItem = {} as Item;
		this.root = new TreeNode<K, Item>(rootId, rootItem, null, []);
		this.nodes.set(rootId, this.root);
	}

	// Get a node by ID
	get(id: K): TreeNode<K, Item> | undefined {
		return this.nodes.get(id);
	}

	// Get all items in the tree
	getAll(): Item[] {
		return Array.from(this.nodes.values()).map((node) => node.item);
	}

	// Get the hierarchical structure of the tree
	getAllHierarchical(): HierarchicalItem<Item> {
		const buildHierarchy = (node: TreeNode<string, Item>): HierarchicalItem<Item> => ({
			...node.item,
			id: node.id,
			children: node.children.map(buildHierarchy),
		});

		return buildHierarchy(this.root as TreeNode<string, Item>);
	}

	// Get the root node's ID
	getRootId(): K {
		return this.root.id;
	}

	// Add a node to the tree
	add(item: Item, parentId?: K, id?: K): TreeNode<K, Item> | undefined {
		const nodeId = id || (generateId() as K);

		// Check if the node already exists
		const existingNode = this.nodes.get(nodeId);
		if (existingNode) {
			// If the parent is different, move the node
			if (existingNode.parentId !== parentId) {
				this.moveNode(nodeId, parentId);
			}

			// Update the item data
			existingNode.item = item;
			return existingNode;
		}

		// Create and add the new node
		const newNode = new TreeNode<K, Item>(nodeId, item, parentId || null, []);
		this.nodes.set(nodeId, newNode);

		if (!parentId) {
			this.root.children.push(newNode);
		} else {
			const parentNode = this.nodes.get(parentId);
			if (parentNode) {
				parentNode.children.push(newNode);
			} else {
				console.error(`Parent node with ID ${parentId} not found.`);
				return undefined;
			}
		}

		return newNode;
	}

	// Move a node to a new parent
	private moveNode(nodeId: K, newParentId: K | null | undefined): void {
		const node = this.nodes.get(nodeId);
		if (!node) {
			console.error(`Node with ID ${nodeId} not found.`);
			return;
		}

		// Remove from old parent
		if (node.parentId) {
			const oldParent = this.nodes.get(node.parentId);
			if (oldParent) {
				oldParent.children = oldParent.children.filter((child) => child.id !== nodeId);
			}
		} else {
			// If no parentId, it's a direct child of root
			this.root.children = this.root.children.filter((child) => child.id !== nodeId);
		}

		// Update parentId
		node.parentId = newParentId || null;

		// Add to new parent
		if (newParentId) {
			const newParent = this.nodes.get(newParentId);
			if (newParent) {
				newParent.children.push(node);
			} else {
				console.error(`New parent node with ID ${newParentId} not found.`);
			}
		} else {
			this.root.children.push(node);
		}
	}

	// Insert a node after a specific sibling
	insert(item: Item, afterNodeId: K, id?: K): TreeNode<K, Item> | undefined {
		const parentNode = this.parent(afterNodeId);

		if (!parentNode) {
			console.error('Parent node not found.', afterNodeId);
			return undefined;
		}

		const nodeId = id || (generateId() as K);
		const newNode = new TreeNode<K, Item>(nodeId, item, parentNode.id, []);
		this.nodes.set(nodeId, newNode);

		const index = parentNode.children.findIndex((child) => child.id === afterNodeId);
		if (index === -1) {
			console.error(`Sibling node with ID ${afterNodeId} not found.`);
			return undefined;
		}

		parentNode.children.splice(index + 1, 0, newNode);
		return newNode;
	}

	// Remove a node and its subtree
	remove(nodeId: K): void {
		const node = this.nodes.get(nodeId);
		if (!node) return;

		// Recursively remove all children
		node.children.forEach((child) => this.remove(child.id));

		// Remove the node itself
		this.removeSingleNode(nodeId);
	}

	// Remove a single node without affecting its children
	removeSingleNode(nodeId: K): void {
		const node = this.nodes.get(nodeId);
		if (!node) return;

		// Remove from parent's children
		if (node.parentId) {
			const parent = this.nodes.get(node.parentId);
			if (parent) {
				parent.children = parent.children.filter((child) => child.id !== nodeId);
			}
		} else {
			// If no parentId, it's a direct child of root
			this.root.children = this.root.children.filter((child) => child.id !== nodeId);
		}

		// Remove from the map
		this.nodes.delete(nodeId);
	}

	// Replace a node's item
	replace(id: K, item: Item): void {
		if (id === this.root.id) {
			console.error('Cannot replace the root node.');
			return;
		}

		const node = this.nodes.get(id);
		if (!node) return;

		node.item = item;
	}

	// Reset the tree to a new root
	reset(rootId: K, rootItem?: Item): void {
		this.nodes = new Map();
		if (!rootItem) rootItem = {} as Item;
		this.root = new TreeNode<K, Item>(rootId, rootItem, null, []);
		this.nodes.set(rootId, this.root);
	}

	// Get the parent of a node
	parent(nodeId: K): TreeNode<K, Item> | undefined {
		const node = this.nodes.get(nodeId);
		if (!node) return undefined;
		if (node.parentId === null) return undefined; // Root has no parent
		return this.nodes.get(node.parentId);
	}

	protected createNode(id: K, item: Item): TreeNode<K, Item> {
		return new TreeNode(id, item);
	}

	previous(nodeId: K): TreeNode<K, Item> | undefined {
		let siblings = this.siblings(nodeId);

		if (siblings) {
			let index = siblings.findIndex((node) => node.id === nodeId);

			if (index > 0) {
				return siblings[index - 1];
			}
		}
		return this.parent(nodeId);
	}

	previousSibling(nodeId: K): TreeNode<K, Item> | undefined {
		let siblings = this.siblings(nodeId);

		if (siblings) {
			let index = siblings.findIndex((node) => node.id === nodeId);

			if (index > 0) {
				return siblings[index - 1];
			}
		} else {
			return undefined;
		}
	}

	next(nodeId: K): TreeNode<K, Item> | undefined {
		let nextSibling = this.nextSibling(nodeId);

		if (nextSibling) {
			return nextSibling;
		} else {
			// If no direct next sibling, try finding the next ancestor sibling
			return this.nextAncestorSibling(nodeId);
		}
	}

	nextSibling(nodeId: K): TreeNode<K, Item> | undefined {
		let siblings = this.siblings(nodeId);

		if (siblings) {
			let index = siblings.findIndex((node) => node.id === nodeId);
			let sibling = index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : undefined;
			return sibling;
		}
		return undefined;
	}

	nextAncestorSibling(nodeId: K): TreeNode<K, Item> | undefined {
		let parent = this.parent(nodeId);
		if (!parent) return undefined; // Reached the root or an error state

		// Attempt to get the next sibling for the parent
		let nextSibling = this.nextSibling(parent.id);

		if (nextSibling) {
			// If a next sibling exists for the parent, return it
			return nextSibling;
		} else {
			// If the parent is the last child, recursively look for the next eligible ancestor sibling
			return this.nextAncestorSibling(parent.id);
		}
	}

	siblings(nodeId: K): TreeNode<K, Item>[] | undefined {
		const parentNode = this.parent(nodeId);

		if (parentNode) {
			return parentNode.children as TreeNode<K, Item>[];
		}
		return undefined;
	}

	getNestingLevel(nodeId: K): number {
		let level = -1; // Start at -1 because root is at level 0
		let currentNode: TreeNode<K, Item> | undefined = this.get(nodeId);

		while (currentNode) {
			level++;
			currentNode = this.parent(currentNode.id);
			if (currentNode && currentNode.id === this.root.id) break;
		}

		return level;
	}

	addNodeToMap(node: TreeNode<K, Item>): void {
		node.children.forEach((child) => this.addNodeToMap(child as TreeNode<K, Item>));
		this.nodes.set(node.id, node);
	}

	removeNodeFromMap(nodeId: K): void {
		const node = this.nodes.get(nodeId);
		node?.children.forEach((child) => this.removeNodeFromMap(child.id));
		this.nodes.delete(nodeId);
	}

	*[Symbol.iterator](): Generator<TreeNode<K, Item>> {
		yield* this.traverse(this.root, {});
	}

	*iterator(
		options: {
			start?: TreeNode<K, Item>;
			match?: (node: TreeNode<K, Item>) => boolean;
			stop?: (node: TreeNode<K, Item>) => boolean;
			reverse?: boolean;
		} = {}
	): Generator<TreeNode<K, Item>> {
		const startNode = options.start || this.root;
		yield* this.traverse(startNode, options);
	}

	private *traverse(
		node: TreeNode<K, Item>,
		options: {
			match?: (node: TreeNode<K, Item>) => boolean;
			stop?: (node: TreeNode<K, Item>) => boolean;
			reverse?: boolean;
		}
	): Generator<TreeNode<K, Item>> {
		const { match = () => true, stop = () => false, reverse = false } = options;

		if (stop(node)) {
			yield node;
			return;
		}

		if (match(node)) {
			yield node;
		}

		const children = reverse ? node.children.slice().reverse() : node.children;

		for (let child of children) {
			yield* this.traverse(child as TreeNode<K, Item>, options);
		}
	}

	processSiblings(
		callback: (siblings: TreeNode<K, Item>[], tree: Tree<K, Item>) => void,
		options: {
			reverse?: boolean;
		} = {}
	): void {
		const { reverse = false } = options;

		const processLevel = (nodes: TreeNode<K, Item>[]) => {
			if (reverse) {
				callback([...nodes].reverse(), this);
			} else {
				callback(nodes, this);
			}

			for (let n of nodes) {
				processLevel(n.children as TreeNode<K, Item>[]);
			}
		};

		processLevel(this.root.children as TreeNode<K, Item>[]);
	}

	getSubtree(nodeId: K): TreeNode<K, Item> | undefined {
		return this.nodes.get(nodeId);
	}

	duplicateSubtree(nodeId: K, newParentId?: K): TreeNode<K, Item> | undefined {
		const originalNode = this.nodes.get(nodeId);
		if (!originalNode) return undefined;

		const duplicateNode = (node: TreeNode<K, Item>, parentId: K | null): TreeNode<K, Item> => {
			const newId = generateId() as K;
			const newItem = JSON.parse(JSON.stringify(node.item)); // Deep copy the item
			const newNode = new TreeNode(newId, newItem, parentId, undefined);

			this.nodes.set(newId, newNode);

			node.children.forEach((child) => {
				const duplicatedChild = duplicateNode(child as TreeNode<K, Item>, newId);
				newNode.children.push(duplicatedChild);
			});

			return newNode;
		};

		const duplicatedSubtree = duplicateNode(originalNode, newParentId || originalNode.parentId);

		// Add the duplicated subtree to the parent
		const parentId = newParentId || originalNode.parentId;
		if (parentId) {
			const parent = this.nodes.get(parentId);
			if (parent) {
				const index = parent.children.findIndex((child) => child.id === nodeId);
				parent.children.splice(index + 1, 0, duplicatedSubtree);
			}
		}

		return duplicatedSubtree;
	}

	// moveSubtree(nodeId: K, newParentId: K): boolean {
	// 	const node = this.nodes.get(nodeId);
	// 	const newParent = this.nodes.get(newParentId);

	// 	if (!node || !newParent) return false;

	// 	// Remove node from its current parent
	// 	if (node.parentId) {
	// 		const currentParent = this.nodes.get(node.parentId);
	// 		if (currentParent) {
	// 			currentParent.children = currentParent.children.filter((child) => child.id !== nodeId);
	// 		}
	// 	}

	// 	// Add node to new parent
	// 	node.parentId = newParentId;
	// 	newParent.children.push(node);

	// 	return true;
	// }

	findPreviousOfType(
		currentId: K,
		match: (node: TreeNode<K, Item>) => boolean
	): TreeNode<K, Item> | undefined {
		let found = false;

		for (let node of this.iterator({ reverse: true })) {
			if (found && match(node)) {
				return node;
			}

			if (node.id === currentId) {
				found = true;
			}
		}
		return undefined;
	}

	findNextOfType(
		currentId: K,
		match: (node: TreeNode<K, Item>) => boolean
	): TreeNode<K, Item> | undefined {
		let found = false;

		for (let node of this) {
			if (found && match(node)) {
				return node;
			}

			if (node.id === currentId) {
				found = true;
			}
		}
		return undefined;
	}

	findNodeInTree(predicate: (node: TreeNode<K, Item>) => boolean): TreeNode<K, Item> | undefined {
		for (let node of this) {
			if (predicate(node)) {
				return node;
			}
		}
		return undefined;
	}

	// Get the depth of the tree
	getDepth(): number {
		return this.getDepthHelper(this.root);
	}

	private getDepthHelper(node: TreeNode<K, Item>): number {
		if (node.children.length === 0) {
			return 1;
		}
		return (
			1 + Math.max(...node.children.map((child) => this.getDepthHelper(child as TreeNode<K, Item>)))
		);
	}

	attachSubtree(subtreeRoot: TreeNode<K, Item>, parentId: K): void {
		// Recursively attach nodes
		const attachNode = (node: TreeNode<K, Item>, parentId: K) => {
			const id = generateId();
			this.add(node.item, parentId as K, id as K);
			node.children.forEach((child) => attachNode(child, id as K));
		};
		subtreeRoot.children.forEach((child) => attachNode(child, parentId as K));
	}

	// New method to get tree content as nested items
	getTreeContent(): Item[] {
		const getContent = (node: TreeNode<K, Item>): Item => {
			const itemCopy = { ...node.item };

			if (node.children.length > 0) {
				(itemCopy as any).content = node.children.map((child) =>
					getContent(child as TreeNode<K, Item>)
				);
			}
			return itemCopy;
		};
		return this.root.children.map((child) => getContent(child as TreeNode<K, Item>));
	}

	// New method to set tree content from nested items
	setTreeContent(content: Item[]): void {
		// clear the current content
		this.reset(this.root.id, this.root.item);

		// iterate the Items and add them to the tree
		const createTreeNodes = (items: Item[], parentId: K) => {
			items.forEach((item) => {
				const id = generateId(); // Implement your own ID generation logic
				const newNode = this.add(item, parentId, id as K);
				if (newNode && (item as any).children) {
					createTreeNodes((item as any).children, id as K);
				}
			});
		};

		createTreeNodes(content, this.root.id);
	}
}
