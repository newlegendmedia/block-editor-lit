import { TemplateResult } from "lit";
import { html, literal } from "lit/static-html.js";
import { contentStore } from "../resourcestore";
import { Model } from "../model/model";
import { ContentId } from "../content/content";

// Import your block components
import "../blocks/ObjectBlock";
import "../blocks/ArrayBlock";
import "../blocks/ElementBlock";
import "../blocks/GroupBlock";

export class ComponentFactory {
  static async createComponent(
    contentId: string,
    path: string,
    inlineModel?: Model,
    inlineValue?: any,
  ): Promise<TemplateResult> {
    try {
      // Handle inline elements
      if (contentId.startsWith("inline:")) {
        return this.createInlineElement(
          contentId,
          path,
          inlineModel,
          inlineValue,
        );
      }

      // Handle mirror blocks
      if (contentId.startsWith("mirror:")) {
        return this.createMirrorBlock(contentId, path);
      }

      // Fetch content for regular blocks
      const content = await contentStore.get(contentId as ContentId);

      if (!content) {
        console.error(
          `ComponentFactory: Content not found for ID ${contentId}`,
        );
        return html`<div>Error: Content not found</div>`;
      }

      // Use the path directly without prefixing
      const fullPath = path;

      // Create the appropriate block based on content type

      switch (content.modelInfo.type) {
        case "object":
          return this.createObjectBlock(contentId, fullPath);
        case "array":
          return this.createArrayBlock(contentId, fullPath);
        case "element":
          return this.createElementBlock(contentId, fullPath);
        case "group":
          return this.createGroupBlock(contentId, fullPath);
        default:
          console.warn(
            `ComponentFactory: Unknown content type: ${content.modelInfo.type}`,
          );
          return html`<div>
            Unknown content type: ${content.modelInfo.type}
          </div>`;
      }
    } catch (error) {
      console.error(
        `ComponentFactory: Error creating component for ID ${contentId}:`,
        error,
      );
      return html`<div>Error: Failed to create component</div>`;
    }
  }

  private static createInlineElement(
    contentId: string,
    path: string,
    inlineModel?: Model,
    inlineValue?: any,
  ): TemplateResult {
    return html`
      <element-block
        .contentId=${contentId}
        .path=${path}
        .inlineModel=${inlineModel}
        .inlineValue=${inlineValue}
        .isInline=${true}
      ></element-block>
    `;
  }

  private static createMirrorBlock(
    contentId: string,
    path: string,
  ): TemplateResult {
    const originalId = contentId.split(":")[1];
    return html`
      <mirror-block
        .contentId=${contentId}
        .referencedContentId=${originalId}
        .path=${path}
      ></mirror-block>
    `;
  }

  private static createObjectBlock(
    contentId: ContentId,
    path: string,
  ): TemplateResult {
    let tag = literal`object-block`;
    return html`
      <${tag} .contentId=${contentId} .path=${path}></${tag}>
    `;
  }

  private static createArrayBlock(
    contentId: ContentId,
    path: string,
  ): TemplateResult {
    return html`
      <array-block .contentId=${contentId} .path=${path}></array-block>
    `;
  }

  private static createElementBlock(
    contentId: ContentId,
    path: string,
  ): TemplateResult {
    return html`
      <element-block .contentId=${contentId} .path=${path}></element-block>
    `;
  }

  private static createGroupBlock(
    contentId: ContentId,
    path: string,
  ): TemplateResult {
    return html`
      <group-block .contentId=${contentId} .path=${path}></group-block>
    `;
  }
}
