import { TreeNode } from './TreeNode';
import { generateId } from '../util/generateId';
import { HierarchicalItem } from './HierarchicalItem';

export class Tree<K, Item> {
	private nodes: Map<K, TreeNode<K, Item>>;
	private root: TreeNode<K, Item>;

	constructor(rootId: K, rootItem?: Item) {
		this.nodes = new Map();
		if (!rootItem) rootItem = {} as Item;
		this.root = new TreeNode(rootId, rootItem, null, undefined, this);
		this.nodes.set(rootId, this.root);
	}

	get(id: K): TreeNode<K, Item> | undefined {
		if (id === this.root.id) return this.root;
		return this.nodes.get(id);
	}

	getAll(): Item[] {
		;
		const items: Item[] = Array.from(this.nodes.values()).map((node) => node.item);
		;
		return items;
	}

	// In your Tree class
	getAllHierarchical(): HierarchicalItem<Item> {
		const buildHierarchy = (node: TreeNode<K, Item>): HierarchicalItem<Item> => {
			return {
				...node.item,
				children: node.children.map((child) => buildHierarchy(child as TreeNode<K, Item>)),
			};
		};

		return buildHierarchy(this.root);
	}

	// getAll(): Item[] {
	// 	const items: Item[] = [];
	// 	;
	// 	const collectItems = (node: TreeNode<K, Item>) => {
	// 		items.push(node.item);
	// 		for (let child of node.children) {
	// 			collectItems(child);
	// 		}
	// 	};
	// 	for (let child of this.root.children) {
	// 		collectItems(child);
	// 	}
	// 	;
	// 	return items;
	// }

	getRootId(): K {
		return this.root.id;
	}

	add(item: Item, parentId?: K, id?: K): TreeNode<K, Item> | undefined {
		;
		const nodeId = id || (generateId() as K);
		const node = new TreeNode(nodeId, item, parentId || null, undefined, this);
		if (!parentId) return this.root.addChild(node);
		return this.nodes.get(parentId)?.addChild(node);
	}

	insert(item: Item, afterNodeId: K, id?: K): TreeNode<K, Item> | undefined {
		const parentNode = this.parent(afterNodeId);
		if (!parentNode) {
			console.error('Parent node not found.', afterNodeId);
			return undefined;
		}
		const nodeId = id || (generateId() as K);
		const node = new TreeNode(nodeId, item, parentNode.id, undefined, this);
		return parentNode.addChild(node, afterNodeId);
	}

	remove(nodeId: K): void {
		if (nodeId === this.root.id) {
			console.error('Cannot remove the root node.');
			return;
		}

		// find the node to remove
		const nodeToRemove = this.nodes.get(nodeId);
		if (!nodeToRemove) return;

		// find it's parent node
		const parentNode = this.nodes.get(nodeToRemove.parentId!);
		if (!parentNode) return;

		// remove the node from the parent's children
		const childIndex = parentNode.children.findIndex((child) => child.id === nodeId);
		if (childIndex !== -1) {
			parentNode.children.splice(childIndex, 1);
		}

		// Recursively remove all children
		nodeToRemove.children.forEach((child) => this.remove(child.id));

		// Finally, remove the node itself
		this.nodes.delete(nodeId);
	}

	replace(id: K, item: Item): void {
		if (id === this.root.id) {
			console.error('Cannot replace the root node.');
			return;
		}

		const nodeToReplace = this.nodes.get(id);
		if (!nodeToReplace) return;

		// Replace the node
		nodeToReplace.item = item;
	}

	reset(rootId: K, rootItem?: Item) {
		this.nodes = new Map();
		if (!rootItem) rootItem = {} as Item;
		this.root = new TreeNode(rootId, rootItem, null, undefined, this);
		this.nodes.set(this.root.id, this.root);
	}

	parent(nodeId: K): TreeNode<K, Item> | undefined {
		const node = this.nodes.get(nodeId);
		const parent = node ? this.nodes.get(node.parentId!) : undefined;
		if (parent === undefined && node?.parentId === this.root.id) return this.root;
		return parent;
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
