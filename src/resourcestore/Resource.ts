// Resource.ts
export interface Resource {
  id: string;
  type: string;
  parentId?: string; // Add this line
}