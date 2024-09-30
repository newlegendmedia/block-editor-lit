interface ZTreeNode<I> {
	id: I;
	parentId: I | null;
	children: I[];
}

interface ZContentNode<I, K, C> extends ZTreeNode<I> {
	id: I;
	key: K;
	type: string;
	content: C;
	children: I[];
	config?: Record<string, any>;
	metadata?: Record<string, any>;
}

type ZContentTreeNode<I, K, C> = ZContentNode<I, K, C> & ZTreeNode<I>;

interface ZContent<I> extends ZContentTreeNode<I, string, string> {
	// Additional properties specific to your use case, if any
}

interface ZTree<I, T extends ZTreeNode<I>> {
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

type ZContentTree<I> = ZTree<I, ZContent<I>>;

type ZStringContentTree = ZContentTree<string>;
type ZNumberContentTree = ZContentTree<number>;
