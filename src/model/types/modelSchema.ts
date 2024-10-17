//
// MODEL SCHEMA
//
import { ModelType } from './model';
import { ModelDefn, ModelRefDefn } from './modelDefn';

export interface ModelSchema {
	name: string;
	models: {
		[key in ModelType]: Record<string, ModelDefn | ModelRefDefn>;
	};
}
