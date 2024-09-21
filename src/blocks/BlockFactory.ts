import { TemplateResult } from 'lit';
import { html } from 'lit/static-html.js';
import { contentStore } from '../content/ContentStore';
import { Model, ModelType } from '../model/model';
import { Content } from '../content/content';
import { modelStore } from '../model/ModelStore';
import { ContentPath } from '../content/ContentPath.ts';

// Import your block components
import './ObjectBlock';
import './ArrayBlock';
import './ElementBlock';
import './GroupBlock';
// import { ContentFactory } from '../content/ContentFactory';
// import { generateId } from '../util/generateId';

export class BlockFactory {
	static async createComponent(
		path: string,
		key: string,
		type: ModelType,
		_inlineValue?: any,
		_inlineModel?: Model
	): Promise<TemplateResult> {
		try {
			const blockPath = new ContentPath(path, key);
			const contentPath = blockPath.path;
			const modelPath = blockPath.simplePath;

			const model = await modelStore.getModel(modelPath, type);
			if (!model) {
				console.error(`BlockFactory: Model not found for ${modelPath}`);
				return html`<div>Error: Model not found ${modelPath}</div>`;
			}

			console.log(`BlockFactory: Creating component for ${key} of type ${type}`, contentPath);
			let content = await contentStore.getOrCreateByPath(contentPath, model);
			if (!content) {
				console.error(`BlockFactory: Content not found for ${contentPath}`);
				return html`<div>Error: Content not found ${contentPath}</div>`;
			}

			// Create the appropriate block based on content type
			switch (content.modelInfo.type) {
				case 'object':
					return this.createObjectBlock(content, model, blockPath);
				case 'array':
					return this.createArrayBlock(content, model, blockPath);
				case 'element':
					return this.createElementBlock(content, model, blockPath);
				case 'group':
					return this.createGroupBlock(content, model, blockPath);
				default:
					console.warn(`BlockFactory: Unknown content type: ${content.modelInfo.type}`);
					return html`<div>Unknown content type: ${content.modelInfo.type}</div>`;
			}
		} catch (error) {
			console.error(`BlockFactory: Error creating component for ID ${key}:`, error);
			return html`<div>Error: Failed to create component</div>`;
		}
	}

	// private static createInlineElement(
	// 	path: string,
	// 	content: Content,
	// 	model: Model,
	// 	inlineModel?: Model,
	// 	inlineValue?: any
	// ): TemplateResult {
	// 	return html`
	// 		<element-block
	// 			.content="${content},"
	// 			.model="${model},"
	// 			.path=${path}
	// 			.inlineModel=${inlineModel}
	// 			.inlineValue=${inlineValue}
	// 			.isInline=${true}
	// 		></element-block>
	// 	`;
	// }

	private static createObjectBlock(
		content: Content,
		model: Model,
		path: ContentPath
	): TemplateResult {
		return html` <object-block .content=${content} .model=${model} .path=${path}></object-block> `;
	}

	private static createArrayBlock(
		content: Content,
		model: Model,
		path: ContentPath
	): TemplateResult {
		return html` <array-block .content=${content} .model=${model} .path=${path}></array-block> `;
	}

	private static createElementBlock(
		content: Content,
		model: Model,
		path: ContentPath
	): TemplateResult {
		return html`
			<element-block .content=${content} .model=${model} .path=${path}></element-block>
		`;
	}

	private static createGroupBlock(
		content: Content,
		model: Model,
		path: ContentPath
	): TemplateResult {
		return html` <group-block .content=${content} .model=${model} .path=${path}></group-block> `;
	}
}
