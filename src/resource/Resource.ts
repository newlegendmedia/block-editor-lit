import { TreeNode } from '../tree/TreeNode';

// Resource.ts
export interface Resource extends TreeNode {
	type: string;
	key: string;
	content: any;
}
export type ResourceId = string;
