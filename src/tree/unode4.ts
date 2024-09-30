type ZNodeId = string | number;

interface JTreeNode<I> {
	id: I;
	parent: I | null;
	children: I[];
}

interface JContentNode<I, K, C> extends JTreeNode<I> {
	id: I;
	key: K;
	type: string;
	content: C;
	children: I[];
	config?: Record<string, any>;
	metadata?: Record<string, any>;
}

type ContentTreeNode<I, K, C> = JContentNode<I, K, C> & TreeNode<I>;

interface JContent<ZNodeId> extends ContentTreeNode<ZNodeId, string, string> {
	// Additional properties specific to your use case, if any
}

// Interface for Tree class
interface JTree<I, T extends JTreeNode<I>> {
	root: I;
	nodes: Map<I, T>;
	addRoot(value: T): NodeId;
	getNodeById(id: NodeId): TreeNode<T> | undefined;
	getNodeByPath(path: Path): TreeNode<T> | undefined;
	addChild(parentId: NodeId, childValue: T, key?: string): NodeId;
	removeNode(id: NodeId): void;
	updateNodeContent(id: NodeId, newValue: T): void;
	traverseDFS(callback: (node: TreeNode<T>) => void): void;
	[Symbol.iterator](): Iterator<TreeNode<T>>;
	print(): void;
}

type JContentTree<I> = JTree<I, JContent<I>>;
