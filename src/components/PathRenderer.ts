import { LitElement, html, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { until } from 'lit/directives/until.js';
import {
	Content,
	ContentId,
	isIndexedCompositeContent,
	isKeyedCompositeContent,
} from '../content/content';
import { contentStore } from '../resourcestore';
import {
	isIndexedCompositeModel,
	isKeyedCompositeModel,
	isElement,
	isObject,
	Model,
} from '../model/model';
import { ComponentFactory } from '../util/ComponentFactory';
import { libraryStore } from '../model/libraryStore';
import { ReactiveController, ReactiveControllerHost } from 'lit';
import { documentManager } from '../store';

class PathController implements ReactiveController {
	private host: ReactiveControllerHost;
	private _path: string = '';
	private _targetContentId: string | null = null;
	private _error: string | null = null;
	private _targetContent: Content | null = null;

	constructor(host: ReactiveControllerHost) {
		this.host = host;
		this.host.addController(this);
	}

	set path(newPath: string) {
		if (this._path !== newPath) {
			this._path = newPath;
			this.findTargetContent();
		}
	}

	get path(): string {
		return this._path;
	}

	get targetContentId(): string | null {
		return this._targetContentId;
	}

	get error(): string | null {
		return this._error;
	}

	get targetContent(): Content | null {
		return this._targetContent;
	}

	hostConnected() {
		// Initialize if needed
	}

	private async findTargetContent() {
		this._error = null;
		this._targetContentId = null;
		this._targetContent = null;

		const pathParts = this._path.split('.');

		if (pathParts.length === 0) {
			this._error = 'Invalid path';
			this.host.requestUpdate();
			return;
		}

		try {
			// The first part is now the document ID
			const documentId = pathParts[0];
			const document = await documentManager.getDocument(documentId);

			if (!document) {
				throw new Error(`Document not found for ID: ${documentId}`);
			}

			// Get the root content for the document
			let currentContent: Content | undefined = await contentStore.get(document.rootContent);

			if (!currentContent) {
				throw new Error(`Root content not found for document: ${documentId}`);
			}

			// Start from the second part of the path (index 1)
			for (let i = 1; i < pathParts.length; i++) {
				const part = pathParts[i];
				const childId = await this.getChildId(currentContent, part);

				if (!childId) {
					throw new Error(`Child content not found for key: ${part}`);
				}

				if (childId.startsWith('inline:')) {
					this._targetContentId = childId;
					this._targetContent = currentContent;
					this.host.requestUpdate();
					return;
				}

				currentContent = await contentStore.get(childId);
				if (!currentContent) {
					throw new Error(`Content not found for id: ${childId}`);
				}
			}

			this._targetContentId = currentContent.id;
			this._targetContent = currentContent;
		} catch (error) {
			console.error('Error in findTargetContent:', error);
			this._error = error instanceof Error ? error.message : String(error);
		}

		this.host.requestUpdate();
	}

	private async getModelForBlock(block: Content): Promise<Model | undefined> {
		return (
			block.modelDefinition ||
			(await libraryStore.value.getDefinition(block.modelInfo.ref!, block.modelInfo.type))
		);
	}

	private async getChildId(content: Content, pathPart: string): Promise<ContentId | undefined> {
		const model = await this.getModelForBlock(content);
		if (!model) {
			console.error(`Model not found for block: ${content.id}`);
			return undefined;
		}
		const childKey = pathPart;
		if (isIndexedCompositeModel(model)) {
			const index = parseInt(childKey, 10);
			if (isIndexedCompositeContent(content)) {
				if (!isNaN(index) && index >= 0 && index < content.children.length) {
					return content.children[index];
				}
			}
		} else if (isKeyedCompositeModel(model)) {
			if (isKeyedCompositeContent(content)) {
				// Handle keyed composite (object)
				if (isObject(model) && model.inlineChildren) {
					const childProperty = model.properties.find((prop) => prop.key === childKey);
					if (childProperty && isElement(childProperty)) {
						const childContentId = `inline:${content.id}:${childKey}`;
						return childContentId;
					}
				}
				return content.content[pathPart];
			}
		}
		return undefined;
	}
}

@customElement('path-renderer')
export class PathRenderer extends LitElement {
	private pathController = new PathController(this);

	@property({ type: String })
	set path(newPath: string) {
		this.pathController.path = newPath;
	}

	get path(): string {
		return this.pathController.path;
	}

	render() {
		return html`
			<div>
				<p>PathRenderer is active. Current path: ${this.path}</p>
				${this.pathController.error
					? html`<div class="error">Error: ${this.pathController.error}</div>`
					: this.pathController.targetContentId
					? html`<div>
							${until(
								this.renderTargetContent(),
								html`<div>Loading content...</div>`,
								html`<div>Error loading content</div>`
							)}
					  </div>`
					: html`<div>Loading...</div>`}
			</div>
		`;
	}

	private async renderTargetContent(): Promise<TemplateResult> {
		if (!this.pathController.targetContentId) return html`<div>No target content found</div>`;

		if (this.pathController.targetContentId.startsWith('inline:')) {
			return html`<div>Path not supported for inline content</div>`;
		}

		const content = this.pathController.targetContent;
		if (!content) return html`<div>Content not found</div>`;

		return ComponentFactory.createComponent(
			content.id || this.pathController.targetContentId,
			this.path
		);
	}
}
