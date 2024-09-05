// src/Resource.ts

export interface Resource {
    id: string;
    type: string;
    data: any;
  }
  
  export interface ContentResource extends Resource {
    type: 'content';
    data: Content;
  }
  
  export interface ModelResource extends Resource {
    type: 'model';
    data: Model;
  }
  
  // You may need to import these types from your existing files
    import { Content } from '../content/content';
    import { Model } from '../model/model';