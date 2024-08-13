import { LitElement } from 'lit';

export const SimplifiedRenderTrackerMixin = <T extends new (...args: any[]) => LitElement>(superClass: T) => {
  class SimplifiedRenderTrackerElement extends superClass {
    private renderCount: number = 0;

    protected override update(changedProperties: Map<PropertyKey, unknown>): void {
      super.update(changedProperties);
      this.renderCount++;
      console.log(`${this.tagName} rendered (${this.renderCount} times). Changed properties: ${Array.from(changedProperties.keys()).join(', ')}`);
    }
  }
  return SimplifiedRenderTrackerElement as T & {new (...args: any[]): SimplifiedRenderTrackerElement};
};