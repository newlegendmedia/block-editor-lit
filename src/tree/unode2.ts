interface XTreeNode<I> {
	id: I;
	parentId: I | null;
	children: I[];
}

// type NodeId<I> = I;
// type Path<I> = NodeId<I>[];

interface XContentNode<I, K, C> extends XTreeNode<I> {
	id: I;
	key: K;
	type: string;
	content: C;
	config?: Record<string, any>;
	metadata?: Record<string, any>;
}

type XContentTreeNode<I, K, C> = XContentNode<I, K, C> & XTreeNode<I>;

// MyContent type
interface XContent<I> extends XContentTreeNode<I, string, string> {
	// Additional properties specific to your use case, if any
}

// Generic Tree interface
interface XTree<I, T extends XTreeNode<I>> {
	root: I;
	nodes: Map<I, T>;
	get(id: I | I[]): T | null;
	getPathById(id: I): I[] | null;
	getIdByPath(path: I[]): I | null;
	add(node: T, parentId?: I | I[], position?: number): T;
	remove(id: I | I[]): boolean;
	set(id: I | I[], item: Partial<T>): T | null;
	update(id: I | I[], updater: (node: T) => T): T | null;
	move(id: I | I[], newParentId: I | I[], position?: number): T | null;
	clone(id: I | I[], newParentId?: I | I[], position?: number): T | null;
}

// ContentTree type
type XContentTree<I> = XTree<I, XContent<I>>;

// Example usage:
type StringContentTree = XContentTree<string>;
type NumberContentTree = XContentTree<number>;
