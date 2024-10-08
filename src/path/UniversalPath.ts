export type PathSegment = {
	modelKey: string;
	contentKey: string;
	index: number;
};

export class UniversalPath {
	segments: PathSegment[];
	private documentId: string;
	private separator: string = '.';

	constructor(fullPath: string, modelKey?: string, contentKey?: string) {
		this.segments = [];

		if (!fullPath.includes('::')) {
			throw new Error('UniversalPath must contain a document ID');
		}

		const [docIdPart, ...pathParts] = fullPath.split('::');
		this.documentId = docIdPart;

		if (pathParts.length > 0 && pathParts[0].length > 0) {
			// Join the remaining parts in case there were extra '::' in the path
			const remainingPath = pathParts.join('::');
			this.parse(remainingPath);
		}
		if (modelKey) {
			contentKey = contentKey || modelKey;
			this.addSegment(modelKey, contentKey);
		}
		console.log('UniversalPath', this.toString(), this);
	}

	private parse(pathString: string): void {
		const parts = pathString.split(this.separator);
		this.segments = parts.map((part, index) => {
			const [modelKey, contentKey] = part.split(':');
			return { modelKey, contentKey: contentKey || modelKey, index };
		});
	}

	addSegment(modelKey: string, contentKey: string): void {
		this.segments.push({ modelKey, contentKey, index: this.segments.length });
	}

	get path(): string {
		return this.segments
			.map((segment) =>
				segment.modelKey === segment.contentKey
					? segment.modelKey
					: `${segment.modelKey}:${segment.contentKey}`
			)
			.join(this.separator);
	}

	get modelPath(): string {
		return this.segments.map((segment) => segment.modelKey).join(this.separator);
	}

	get contentPath(): string {
		return `${this.documentId}::${this.segments.map((segment) => segment.contentKey).join(this.separator)}`;
	}

	get numericPath(): number[] {
		return this.segments.map((segment) => segment.index);
	}

	get numericParentPath(): number[] {
		return this.segments.slice(0, -1).map((segment) => segment.index);
	}

	get modelParent(): string {
		return this.segments
			.slice(0, -1)
			.map((segment) => segment.modelKey)
			.join(this.separator);
	}

	get contentParent(): string {
		const parentSegments = this.segments.slice(0, -1);
		return parentSegments.length > 0
			? `${this.documentId}::${parentSegments.map((segment) => segment.contentKey).join(this.separator)}`
			: this.documentId + '::';
	}

	get modelKey(): string {
		return this.segments[this.segments.length - 1]?.modelKey || '';
	}

	get contentKey(): string {
		return this.segments[this.segments.length - 1]?.contentKey || '';
	}

	get document(): string {
		return this.documentId;
	}

	toString(): string {
		return this.contentPath;
	}

	toJSON(): string {
		return this.toString();
	}

	static fromDocumentId(docId: string, key?: string): UniversalPath {
		const path = new UniversalPath(docId + '::');
		if (key) {
			path.addSegment(key, key);
		}
		return path;
	}
}
