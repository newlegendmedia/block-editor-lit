import { Content, ContentId } from '../content/content';

type ContentObserver<T = unknown> = (content: Content<T> | undefined) => void;

export class ContentItemMap {
  private items: Map<ContentId, Content<any>> = new Map();
  private observers: Map<ContentId, Set<ContentObserver<any>>> = new Map();

  get<T>(id: ContentId): Content<T> | undefined {
    return this.items.get(id) as Content<T> | undefined;
  }

  set<T>(id: ContentId, content: Content<T>): void {
    this.items.set(id, content);
    this.notifyObservers(id, content);
  }

  delete(id: ContentId): void {
    this.items.delete(id);
    this.notifyObservers(id, undefined);
  }

  observe<T>(id: ContentId, observer: ContentObserver<T>): () => void {
    if (!this.observers.has(id)) {
      this.observers.set(id, new Set());
    }
    this.observers.get(id)!.add(observer as ContentObserver<any>);

    const content = this.get(id);
    if (content) {
      observer(content as Content<T>);
    }

    return () => {
      const observersForId = this.observers.get(id);
      if (observersForId) {
        observersForId.delete(observer as ContentObserver<any>);
        if (observersForId.size === 0) {
          this.observers.delete(id);
        }
      }
    };
  }

  private notifyObservers<T>(id: ContentId, content: Content<T> | undefined): void {
    const observersForId = this.observers.get(id);
    if (observersForId) {
      observersForId.forEach(observer => observer(content as any));
    }
  }
}