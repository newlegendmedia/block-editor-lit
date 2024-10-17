import { MappedArray } from './MappedArray';
import { NodeId, Path, ResolvedNode, TreeNode } from './TreeNode';

// HierarchicalItem.ts
export type HierarchicalItem<T> = T & {
	id: string;
	children: HierarchicalItem<T>[];
};

export class Tree<T extends TreeNode> {
	private nodes: MappedArray<'id', T>;
	private root: NodeId;

	constructor(root: T) {
		this.nodes = new MappedArray<'id', T>('id');
		this.root = root.id;
		this.nodes.add(root);
	}

	get(id: NodeId | Path): T | undefined {
		return typeof id === 'string' ? this.getById(id) : this.getByPath(id);
	}

	getById(id: NodeId): T | undefined {
		return this.nodes.getByKey(id);
	}

	parent(node: T): T | undefined {
		return node.parentId ? this.nodes.getByKey(node.parentId) : undefined;
	}

	getByPath(path: Path): T | undefined {
		let currentNode = this.nodes.getByIndex(0); // Root node
		for (const index of path) {
			if (!currentNode || index >= currentNode.children.length) {
				return undefined;
			}
			const childId = currentNode.children[index];
			currentNode = this.nodes.getByKey(childId);
		}
		return currentNode;
	}

	getParent(id: NodeId | Path): T | undefined {
		const node = this.get(id);
		return node?.parentId ? this.nodes.getByKey(node.parentId) : undefined;
	}

	getAll(): T[] {
		return Array.from(this.nodes);
	}

	getAllHierarchical(): HierarchicalItem<T> {
		const rootNode = this.getById(this.root);
		if (!rootNode) {
			throw new Error('Root node not found');
		}
		return this.buildHierarchicalItem(rootNode);
	}

	private buildHierarchicalItem(node: T): HierarchicalItem<T> {
		const { children: childIds, ...rest } = node;
		const hierarchicalChildren = childIds.map((childId) => {
			const childNode = this.getById(childId);
			if (!childNode) {
				throw new Error(`Child node with id ${childId} not found`);
			}
			return this.buildHierarchicalItem(childNode);
		});
		return {
			...rest,
			id: node.id,
			children: hierarchicalChildren,
		} as HierarchicalItem<T>;
	}

	getResolved(id: NodeId | Path, visited = new Set<NodeId>()): ResolvedNode<T> | undefined {
		const node = this.get(id);
		if (!node || visited.has(node.id)) return undefined;
		visited.add(node.id);

		const resolvedChildren = node.children
			.map((childId) => this.getResolved(childId, visited))
			.filter((child): child is ResolvedNode<T> => child !== undefined);

		return { ...node, children: resolvedChildren };
	}

	// add(node: T, parent?: NodeId | Path, position?: number): T {
	// 	if (this.nodes.getByKey(node.id)) {
	// 		throw new Error(`Node with id ${node.id} already exists`);
	// 	}

	// 	if (parent !== undefined) {
	// 		const parentNode = this.assignParent(node, parent);
	// 		this.assignChild(parentNode, node, position);
	// 	} else if (node.id !== this.root) {
	// 		throw new Error('Only the root node can have no parent');
	// 	}

	// 	this.nodes.add(node);
	// 	return node;
	// }

	add(node: T, parent?: NodeId | Path, _id?: NodeId): T {
		const existingNode = this.nodes.getByKey(node.id);
		if (existingNode) {
			// Update existing node
			this.nodes.setByKey(node.id, node);
			return node;
		}

		if (node.id !== this.root) {
			parent = parent ?? this.root;
			const parentNode = this.assignParent(node, parent);
			this.assignChild(parentNode, node);
		}

		this.nodes.add(node);
		return node;
	}

	remove(id: NodeId | Path): T {
		const nodeToRemove = this.get(id);
		if (!nodeToRemove) {
			throw new Error(`Node with id ${id} not found`);
		}

		this.removeFromParent(nodeToRemove);
		this.removeDescendants(nodeToRemove.id);
		this.nodes.remove(nodeToRemove.id);

		return nodeToRemove;
	}

	// Set - update without callback
	set(id: NodeId | Path, node: T): T {
		const nodeToUpdate = this.get(id);
		if (!nodeToUpdate) {
			throw new Error(`Node with id ${id} not found`);
		}

		if (node.id !== nodeToUpdate.id) {
			throw new Error('Updated node ID cannot be changed');
		}

		this.nodes.setByKey(node.id, node);
		return node;
	}

	update(id: NodeId | Path, updater: (node: T) => T): T {
		const nodeToUpdate = this.get(id);
		if (!nodeToUpdate) {
			throw new Error(`Node with id ${id} not found`);
		}

		const updatedNode = updater({ ...nodeToUpdate });
		if (updatedNode.id !== nodeToUpdate.id) {
			throw new Error('Updated node ID cannot be changed');
		}

		this.nodes.setByKey(updatedNode.id, updatedNode);

		return updatedNode;
	}

	getPathById(id: NodeId): Path | undefined {
		const path: Path = [];
		let currentNode = this.nodes.getByKey(id);

		while (currentNode && currentNode.id !== this.root) {
			const parentNode = currentNode.parentId ? this.nodes.getByKey(currentNode.parentId) : null;
			if (!parentNode) return undefined;

			const index = parentNode.children.indexOf(currentNode.id);
			if (index === -1) return undefined;

			path.unshift(index);
			currentNode = parentNode;
		}

		return path;
	}

	getIdByPath(path: Path): NodeId | undefined {
		let currentNode = this.nodes.getByIndex(0); // Root node
		for (const index of path) {
			if (!currentNode || index >= currentNode.children.length) {
				return undefined;
			}
			currentNode = this.nodes.getByKey(currentNode.children[index]);
		}
		return currentNode?.id;
	}

	private assignParent(node: T, parent: NodeId | Path): T {
		const parentNode = this.get(parent);
		if (!parentNode) {
			throw new Error(`Parent node ${parent} not found`);
		}
		node.parentId = parentNode.id;
		return parentNode;
	}

	private assignChild(parent: T, child: T, position?: number): void {
		if (position !== undefined && position >= 0 && position <= parent.children.length) {
			parent.children.splice(position, 0, child.id);
		} else {
			parent.children.push(child.id);
		}
	}

	private removeDescendants(nodeId: NodeId) {
		const node = this.nodes.getByKey(nodeId);
		if (node) {
			for (const childId of node.children) {
				this.removeDescendants(childId);
				this.nodes.remove(childId);
			}
		}
	}

	private removeFromParent(node: T): void {
		if (node.parentId) {
			const parentNode = this.nodes.getByKey(node.parentId);
			if (parentNode) {
				parentNode.children = parentNode.children.filter((id) => id !== node.id);
			}
		}
	}
}
