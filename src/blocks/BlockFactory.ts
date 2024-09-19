import { TemplateResult } from 'lit';
import { html } from 'lit/static-html.js';
import { contentStore } from '../content/ContentStore';
import { Model, ModelType } from '../model/model';
import { Content } from '../content/content';
import { modelStore } from '../model/ModelStore';

// Import your block components
import './ObjectBlock';
import './ArrayBlock';
import './ElementBlock';
import './GroupBlock';
import { ContentFactory } from '../content/ContentFactory';
import { generateId } from '../util/generateId';

function replaceColonParts(path: string): string {
	// Split the path into parts using the dot as the delimiter
	const parts = path.split('.');

	// Iterate over each part
	const newParts = parts.map((part) => {
		// Check if the part contains a colon
		const colonIndex = part.indexOf(':');
		if (colonIndex !== -1) {
			// Replace the part with the text after the colon
			return part.substring(colonIndex + 1);
		}
		// Return the part as is if no colon is found
		return part;
	});

	// Join the parts back together using the dot as the delimiter
	return newParts.join('.');
}

export class BlockFactory {
	static async createComponent(
		path: string,
		key: string,
		type: ModelType,
		_inlineValue?: any,
		_inlineModel?: Model
	): Promise<TemplateResult> {
		try {
			console.log(`BlockFactory: Creating component for key ${key}`, path, type);

			const fullPath = path ? `${path}.${key}` : key;

			// if first part of path is a document id (starts with DOC-), remove that part even if its the only part meaning there are no dots
			if (path.startsWith('DOC-')) {
				const parts = path.split('.');
				if (parts.length === 1) {
					path = '';
				} else {
					path = parts.slice(1).join('.');
				}
			}
			const parentPath = path;
			const contentPath = path ? `${path}.${key}` : key;
			const modelPath = replaceColonParts(contentPath);

			console.log(`BlockFactory: Paths: ${fullPath} ${parentPath} ${contentPath} ${modelPath}`);

			const model = await modelStore.getModel(modelPath, type);
			if (!model) {
				console.error(`BlockFactory: Model not found for ${fullPath}`);
				return html`<div>Error: Model not found ${fullPath} ${key}</div>`;
			}

			let content = await contentStore.getByPath(contentPath);
			if (!content) {
				const defaultContent = ContentFactory.createContentFromModel(model);
				content = {
					id: generateId('CONTENT'),
					...defaultContent,
				};
				content = await contentStore.add(content, parentPath, contentPath);
			}

			// Create the appropriate block based on content type
			switch (content.modelInfo.type) {
				case 'object':
					return this.createObjectBlock(content, model, fullPath, key);
				case 'array':
					return this.createArrayBlock(content, model, fullPath, key);
				case 'element':
					return this.createElementBlock(content, model, fullPath, key);
				case 'group':
					return this.createGroupBlock(content, model, fullPath, key);
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
		path: string,
		key: string
	): TemplateResult {
		return html`
			<object-block .content=${content} .model=${model} .path=${path} .key=${key}></object-block>
		`;
	}

	private static createArrayBlock(
		content: Content,
		model: Model,
		path: string,
		key: string
	): TemplateResult {
		return html`
			<array-block .content=${content} .model=${model} .path=${path} .key=${key}></array-block>
		`;
	}

	private static createElementBlock(
		content: Content,
		model: Model,
		path: string,
		key: string
	): TemplateResult {
		return html`
			<element-block .content=${content} .model=${model} .path=${path} .key=${key}></element-block>
		`;
	}

	private static createGroupBlock(
		content: Content,
		model: Model,
		path: string,
		key: string
	): TemplateResult {
		return html`
			<group-block .content=${content} .model=${model} .path=${path} .key=${key}></group-block>
		`;
	}
}
