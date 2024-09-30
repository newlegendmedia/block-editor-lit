type NodeId = string | number;
type PathSegment = string | number;
type Path = PathSegment[];

interface TreeNode<T> {
	id: NodeId;
	value: T;
	parent: NodeId | null;
	children: Map<string, NodeId> | NodeId[];
}

// Interface for Tree class
interface Tree<T> {
	addRoot(value: T): NodeId;
	getNodeById(id: NodeId): TreeNode<T> | undefined;
	getNodeByPath(path: Path): TreeNode<T> | undefined;
	addChild(parentId: NodeId, childValue: T, key?: string): NodeId;
	removeNode(id: NodeId): void;
	updateNodeValue(id: NodeId, newValue: T): void;
	traverseDFS(callback: (node: TreeNode<T>) => void): void;
	[Symbol.iterator](): Iterator<TreeNode<T>>;
	print(): void;
}

// Define a Tree class interface
interface Tree<T> {
	addRoot(value: T): NodeId;
	getNodeById(id: NodeId): TreeNode<T> | undefined;
	getNodeByPath(path: Path): TreeNode<T> | undefined;
	addChild(parentId: NodeId, childValue: T, key?: string): NodeId;
	removeNode(id: NodeId): void;
	updateNodeValue(id: NodeId, newValue: T): void;
	traverseDFS(callback: (node: TreeNode<T>) => void): void;
	[Symbol.iterator](): Iterator<TreeNode<T>>;
	print(): void;
}

class Tree<T> {
	private nodes: Map<NodeId, TreeNode<T>> = new Map();
	private roots: Set<NodeId> = new Set();

	constructor() {}

	private generateId(): NodeId {
		return Math.random().toString(36).substr(2, 9);
	}

	addRoot(value: T): NodeId {
		const rootId = this.generateId();
		const rootNode: TreeNode<T> = {
			id: rootId,
			value: value,
			parent: null,
			children: new Map(),
		};
		this.nodes.set(rootId, rootNode);
		this.roots.add(rootId);
		return rootId;
	}

	getNodeById(id: NodeId): TreeNode<T> | undefined {
		return this.nodes.get(id);
	}

	getNodeByPath(path: Path): TreeNode<T> | undefined {
		if (path.length === 0) return undefined;

		// Check if the first segment is a root node
		let currentNode = this.nodes.get(path[0] as NodeId);

		// If not found as a root, search all roots for the path
		if (!currentNode) {
			for (const rootId of this.roots) {
				currentNode = this.getNodeByPathFromRoot(rootId, path);
				if (currentNode) break;
			}
		} else {
			// If it is a root, traverse from there
			currentNode = this.getNodeByPathFromRoot(currentNode.id, path.slice(1));
		}

		return currentNode;
	}

	private getNodeByPathFromRoot(startNodeId: NodeId, path: Path): TreeNode<T> | undefined {
		let currentNode = this.nodes.get(startNodeId);
		if (!currentNode) return undefined;

		for (const segment of path) {
			if (currentNode.children instanceof Map) {
				currentNode = this.nodes.get(currentNode.children.get(segment as string)!);
			} else if (Array.isArray(currentNode.children)) {
				currentNode = this.nodes.get(currentNode.children[segment as number]);
			} else {
				return undefined;
			}
			if (!currentNode) return undefined;
		}
		return currentNode;
	}

	addChild(parentId: NodeId, childValue: T, key?: string): NodeId {
		const parent = this.nodes.get(parentId);
		if (!parent) throw new Error('Parent node not found');

		const childId = this.generateId();
		const childNode: TreeNode<T> = {
			id: childId,
			value: childValue,
			parent: parentId,
			children: parent.children instanceof Map ? new Map() : [],
		};

		this.nodes.set(childId, childNode);

		if (parent.children instanceof Map) {
			if (key === undefined) throw new Error('Key is required for object nodes');
			parent.children.set(key, childId);
		} else if (Array.isArray(parent.children)) {
			parent.children.push(childId);
		}

		return childId;
	}

	removeNode(id: NodeId): void {
		const node = this.nodes.get(id);
		if (!node) return;

		if (node.parent) {
			const parent = this.nodes.get(node.parent);
			if (parent) {
				if (parent.children instanceof Map) {
					for (const [key, value] of parent.children) {
						if (value === id) {
							parent.children.delete(key);
							break;
						}
					}
				} else if (Array.isArray(parent.children)) {
					const index = parent.children.indexOf(id);
					if (index !== -1) {
						parent.children.splice(index, 1);
					}
				}
			}
		} else {
			// If it's a root node, remove it from the roots set
			this.roots.delete(id);
		}

		// Recursively remove all children
		const removeChildren = (nodeId: NodeId) => {
			const node = this.nodes.get(nodeId);
			if (!node) return;
			if (node.children instanceof Map) {
				for (const childId of node.children.values()) {
					removeChildren(childId);
				}
			} else if (Array.isArray(node.children)) {
				for (const childId of node.children) {
					removeChildren(childId);
				}
			}
			this.nodes.delete(nodeId);
		};

		removeChildren(id);
	}

	updateNodeValue(id: NodeId, newValue: T): void {
		const node = this.nodes.get(id);
		if (node) {
			node.value = newValue;
		}
	}

	traverseDFS(callback: (node: TreeNode<T>) => void): void {
		const dfs = (nodeId: NodeId) => {
			const node = this.nodes.get(nodeId);
			if (!node) return;

			callback(node);

			if (node.children instanceof Map) {
				for (const childId of node.children.values()) {
					dfs(childId);
				}
			} else if (Array.isArray(node.children)) {
				for (const childId of node.children) {
					dfs(childId);
				}
			}
		};

		for (const rootId of this.roots) {
			dfs(rootId);
		}
	}

	[Symbol.iterator](): Iterator<TreeNode<T>> {
		const nodes = this.nodes;
		let done = false;
		const stack: NodeId[] = Array.from(this.roots).reverse();

		return {
			next(): IteratorResult<TreeNode<T>> {
				if (done || stack.length === 0) {
					done = true;
					return { done: true, value: undefined };
				}

				const currentId = stack.pop()!;
				const currentNode = nodes.get(currentId)!;

				if (currentNode.children instanceof Map) {
					stack.push(...Array.from(currentNode.children.values()).reverse());
				} else if (Array.isArray(currentNode.children)) {
					stack.push(...currentNode.children.slice().reverse());
				}

				return { done: false, value: currentNode };
			},
		};
	}

	print(): void {
		const printNode = (id: NodeId, depth: number) => {
			const node = this.nodes.get(id);
			if (!node) return;

			console.log('  '.repeat(depth) + `${id}: ${JSON.stringify(node.value)}`);

			if (node.children instanceof Map) {
				for (const [key, childId] of node.children) {
					console.log('  '.repeat(depth + 1) + `${key}:`);
					printNode(childId, depth + 2);
				}
			} else if (Array.isArray(node.children)) {
				node.children.forEach((childId, index) => {
					console.log('  '.repeat(depth + 1) + `${index}:`);
					printNode(childId, depth + 2);
				});
			}
		};

		for (const rootId of this.roots) {
			printNode(rootId, 0);
		}
	}
}
