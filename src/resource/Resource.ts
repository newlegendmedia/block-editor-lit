import { TreeNode } from '../tree/TreeNode';

// Resource.ts
export interface Resource extends TreeNode {
	id: ResourceId;
	type: string;
	key: string;
}
export type ResourceId = string;
