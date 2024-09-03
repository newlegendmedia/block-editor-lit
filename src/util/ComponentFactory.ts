import { html, TemplateResult } from 'lit';
import { contentStore } from '../store';
import { ModelLibrary } from '../model/libraryStore';
import { Model } from '../model/model';
import { ContentId } from '../content/content';

// Import your block components
import '../blocks/ObjectBlock';
import '../blocks/ArrayBlock';
import '../blocks/ElementBlock';
import '../blocks/GroupBlock';
import '../blocks/MirrorBlock';

export class ComponentFactory {
	static async createComponent(
		contentId: string,
		library: ModelLibrary,
		path: string,
		inlineModel?: Model,
		inlineValue?: any
	): Promise<TemplateResult> {
		try {
			// Handle inline elements
			if (contentId.startsWith('inline:')) {
				return this.createInlineElement(contentId, library, path, inlineModel, inlineValue);
			}

			// Handle mirror blocks
			if (contentId.startsWith('mirror:')) {
				return this.createMirrorBlock(contentId, library, path);
			}

			// Fetch content for regular blocks
			const content = await contentStore.getContent(contentId);

			if (!content) {
				console.error(`ComponentFactory: Content not found for ID ${contentId}`);
				return html`<div>Error: Content not found</div>`;
			}

			const fullPath = path || content.modelInfo.key;

			// Create the appropriate block based on content type
			switch (content.modelInfo.type) {
				case 'object':
					return this.createObjectBlock(contentId, library, fullPath);
				case 'array':
					return this.createArrayBlock(contentId, library, fullPath);
				case 'element':
					return this.createElementBlock(contentId, library, fullPath);
				case 'group':
					return this.createGroupBlock(contentId, library, fullPath);
				default:
					console.warn(`ComponentFactory: Unknown content type: ${content.modelInfo.type}`);
					return html`<div>Unknown content type: ${content.modelInfo.type}</div>`;
			}
		} catch (error) {
			console.error(`ComponentFactory: Error creating component for ID ${contentId}:`, error);
			return html`<div>Error: Failed to create component</div>`;
		}
	}

	private static createInlineElement(
		contentId: string,
		library: ModelLibrary,
		path: string,
		inlineModel?: Model,
		inlineValue?: any
	): TemplateResult {
		return html`
			<element-block
				.contentId=${contentId}
				.library=${library}
				.path=${path}
				.inlineModel=${inlineModel}
				.inlineValue=${inlineValue}
				.isInline=${true}
			></element-block>
		`;
	}

	private static createMirrorBlock(
		contentId: string,
		library: ModelLibrary,
		path: string
	): TemplateResult {
		const originalId = contentId.split(':')[1];
		return html`
			<mirror-block
				.contentId=${contentId}
				.referencedContentId=${originalId}
				.library=${library}
				.path=${path}
			></mirror-block>
		`;
	}

	private static createObjectBlock(
		contentId: ContentId,
		library: ModelLibrary,
		path: string
	): TemplateResult {
		return html`
			<object-block .contentId=${contentId} .library=${library} .path=${path}></object-block>
		`;
	}

	private static createArrayBlock(
		contentId: ContentId,
		library: ModelLibrary,
		path: string
	): TemplateResult {
		return html`
			<array-block .contentId=${contentId} .library=${library} .path=${path}></array-block>
		`;
	}

	private static createElementBlock(
		contentId: ContentId,
		library: ModelLibrary,
		path: string
	): TemplateResult {
		return html`
			<element-block .contentId=${contentId} .library=${library} .path=${path}></element-block>
		`;
	}

	private static createGroupBlock(
		contentId: ContentId,
		library: ModelLibrary,
		path: string
	): TemplateResult {
		return html`
			<group-block .contentId=${contentId} .library=${library} .path=${path}></group-block>
		`;
	}
}
