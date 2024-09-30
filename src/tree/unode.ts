// interface UniversalNode {
//   id: string;
//   type: 'text' | 'heading' | 'list-item' | 'image' | 'code' | /* other types */;
//   content: string;
//   children: UniversalNode[];
//   metadata: {
//     createdAt: Date;
//     updatedAt: Date;
//     version: number;
//     placeholder?: string;
//     // Other metadata as needed
//   };
// }

//import { AtomType, Model, ModelType } from '../model/model';
import { ModelInfo } from '../content/content';

// interface Node {
//     id: string;
//     key: string;
//     content: {
//         type: string;
//         base: 'string' | 'number' | 'boolean' | 'object' | 'array';
//         value: string | number | boolean | object | any[];
//     }
//     children: Node[];  // child nodes allow for nested content
//     metadata: {
//         createdAt: Date;
//         updatedAt: Date;
//         version: number;
//     }
// }

// interface TreeNode<Item> {
// 	id: string;
// 	item: Item;
// 	parentId: string | null;
// 	children: TreeNode<Item>[];
// }

// interface OContentNode {
// 	id: string;
// 	key: string;
// 	content: any;
// 	children: Node[];
// 	config?: Record<string, Model>;
// 	metadata?: Record<string, Model>;
// }

interface TreeNode<I> {
	id: I;
	parentId: I | null;
	children: I[];
}

type NodeId<I> = I;
type Path<I> = NodeId<I>[];

interface Tree<T extends TreeNode<I>, I> {
	root: NodeId<I>;
	nodes: Map<I, T>;
	get(id: I | Path<I>): T | null;
	getPathById(id: I): Path<I> | null;
	getIdByPath<I>(path: Path<I>): I | null;
	add(node: T, parentId?: I | Path<I>, position?: number): T;
	remove(id: I | Path<I>): boolean;
	set(id: I | Path<I>, item: Partial<T>): T | null;
	update(id: I | Path<I>, updater: (node: T) => T): T | null;
	move(id: I | Path<I>, newParentId: I | Path<I>, position?: number): T | null;
	clone(id: I | Path<I>, newParentId?: I | Path<I>, position?: number): T | null;
}

interface ContentNode<I, K, C> extends TreeNode<I> {
	id: I;
	key: K;
	type: string;
	content: C;
	config?: Record<string, any>;
	metadata?: Record<string, any>;
}

//type ContentTree<T, I> = Tree<ContentNode<T, I>, I>;

// Example usage
// type MyContentType = {
// 	modelInfo: ModelInfo;
// 	value: string;
// };

// // Tree using string IDs
// const stringIdTree: ContentTree<MyContentType, string> = {
// 	root: 'root-id',
// 	nodes: new Map(),
// 	// ... method implementations
// };

// // Tree using number IDs
// const numberIdTree: ContentTree<MyContentType, number> = {
// 	root: 1,
// 	nodes: new Map(),
// 	// ... method implementations
// };

// // Tree using a custom ID type
// type CustomId = { primary: string; secondary: number };
// const customIdTree: ContentTree<MyContentType, CustomId> = {
// 	root: { primary: 'root', secondary: 0 },
// 	nodes: new Map(),
// 	// ... method implementations
// };
