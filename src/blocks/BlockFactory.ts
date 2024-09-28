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
		contentPath: string,
		contentKey: string,
		modelPath: string,
		modelKey: string,
		type?: ModelType,
		_inlineValue?: any,
		_inlineModel?: Model
	): Promise<TemplateResult> {
		try {
			const cPath = new ContentPath(contentPath, contentKey);
			const mPath = new ContentPath(modelPath, modelKey);

			const model = await modelStore.getModel(mPath.simplePath, type);
			if (!model) {
				console.error(`BlockFactory: Model not found for ${mPath.toString()}`);
				return html`<div>Error: Model not found ${mPath.toString()}</div>`;
			}

			let content = await contentStore.getOrCreateByPath(cPath.toString(), model);
			if (!content) {
				console.error(`BlockFactory: Content not found for ${cPath}`);
				return html`<div>Error: Content not found ${cPath}</div>`;
			}

			// Create the appropriate block based on content type
			switch (content.modelInfo.type) {
				case 'object':
					return this.createObjectBlock(content, model, cPath, mPath);
				case 'array':
					return this.createArrayBlock(content, model, cPath, mPath);
				case 'element':
					return this.createElementBlock(content, model, cPath, mPath);
				case 'group':
					return this.createGroupBlock(content, model, cPath, mPath);
				default:
					console.warn(`BlockFactory: Unknown content type: ${content.modelInfo.type}`);
					return html`<div>Unknown content type: ${content.modelInfo.type}</div>`;
			}
		} catch (error) {
			console.error(
				`BlockFactory: Error creating component for ID ${modelKey} ${contentKey}:`,
				error
			);
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
		contentPath: ContentPath,
		modelPath: ContentPath
	): TemplateResult {
		return html`
			<object-block
				.content=${content}
				.model=${model}
				.contentPath=${contentPath}
				.modelPath=${modelPath}
			></object-block>
		`;
	}

	private static createArrayBlock(
		content: Content,
		model: Model,
		contentPath: ContentPath,
		modelPath: ContentPath
	): TemplateResult {
		return html`
			<array-block
				.content=${content}
				.model=${model}
				.contentPath=${contentPath}
				.modelPath=${modelPath}
			></array-block>
		`;
	}

	private static createElementBlock(
		content: Content,
		model: Model,
		contentPath: ContentPath,
		modelPath: ContentPath
	): TemplateResult {
		return html`
			<element-block
				.content=${content}
				.model=${model}
				.contentPath=${contentPath}
				.modelPath=${modelPath}
			></element-block>
		`;
	}

	private static createGroupBlock(
		content: Content,
		model: Model,
		contentPath: ContentPath,
		modelPath: ContentPath
	): TemplateResult {
		return html`
			<group-block
				.content=${content}
				.model=${model}
				.contentPath=${contentPath}
				.modelPath=${modelPath}
			></group-block>
		`;
	}
}
