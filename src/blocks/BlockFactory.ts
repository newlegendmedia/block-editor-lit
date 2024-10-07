import { html, TemplateResult } from 'lit';
import { UniversalPath } from '../path/UniversalPath';
import { modelStore } from '../model/ModelStore';
import { contentStore } from '../content/ContentStore';
import { Model, ModelType } from '../model/model';
import { Content } from '../content/content';

import './ObjectBlock';
import './ArrayBlock';
import './ElementBlock';
import './GroupBlock';

export class BlockFactory {
	static async createComponent(path: UniversalPath, type?: ModelType): Promise<TemplateResult> {
		try {
			const model = await modelStore.getModel(path.modelPath, type);
			if (!model) {
				console.error(`BlockFactory: Model not found for ${path.modelPath}`);
				return html`<div>Error: Model not found ${path.modelPath}</div>`;
			}

			const content = await this.getOrCreateContent(path, model);
			if (!content) {
				console.error(`BlockFactory: Content not found for ${path.contentPath}`);
				return html`<div>Error: Content not found ${path.contentPath}</div>`;
			}

			// Create the appropriate block based on content type
			switch (content.type) {
				case 'object':
					return this.createObjectBlock(content, model, path);
				case 'array':
					return this.createArrayBlock(content, model, path);
				case 'element':
					return this.createElementBlock(content, model, path);
				case 'group':
					return this.createGroupBlock(content, model, path);
				default:
					console.warn(`BlockFactory: Unknown content type: ${content.type}`);
					return html`<div>Unknown content type: ${content.type}</div>`;
			}
		} catch (error) {
			console.error(`BlockFactory: Error creating component for path ${path.toString()}:`, error);
			return html`<div>Error: ${error instanceof Error ? error.message : String(error)}</div>`;
		}
	}

	private static async getOrCreateContent(
		path: UniversalPath,
		model: Model
	): Promise<Content | undefined> {
		return contentStore.getOrCreateByPath(path, model);
	}

	private static createObjectBlock(
		content: Content,
		model: Model,
		path: UniversalPath
	): TemplateResult {
		return html` <object-block .content=${content} .model=${model} .path=${path}></object-block> `;
	}

	private static createArrayBlock(
		content: Content,
		model: Model,
		path: UniversalPath
	): TemplateResult {
		return html` <array-block .content=${content} .model=${model} .path=${path}></array-block> `;
	}

	private static createElementBlock(
		content: Content,
		model: Model,
		path: UniversalPath
	): TemplateResult {
		return html`
			<element-block .content=${content} .model=${model} .path=${path}></element-block>
		`;
	}

	private static createGroupBlock(
		content: Content,
		model: Model,
		path: UniversalPath
	): TemplateResult {
		return html` <group-block .content=${content} .model=${model} .path=${path}></group-block> `;
	}

	static async createInlineComponent(
		path: UniversalPath,
		content: Content,
		model: Model,
		inlineModel?: Model,
		inlineValue?: any
	): Promise<TemplateResult> {
		return html`
			<element-block
				.content=${content}
				.model=${model}
				.path=${path}
				.inlineModel=${inlineModel}
				.inlineValue=${inlineValue}
				.isInline=${true}
			></element-block>
		`;
	}
}
