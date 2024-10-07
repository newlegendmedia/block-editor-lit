export type PathSegment = {
	modelKey: string;
	contentKey: string;
	index: number;
};

export class UniversalPath {
	segments: PathSegment[];
	private separator: string;
	private documentId: string;

	constructor(documentId: string, pathString?: string, separator: string = '.') {
		this.segments = [];
		this.separator = separator;
		this.documentId = documentId;
		if (pathString) {
			this.parse(pathString);
		}
	}

	private parse(pathString: string): void {
		const parts = pathString.split(this.separator);
		this.segments = parts.map((part, index) => {
			const [modelKey, contentKey] = part.split(':');
			return { modelKey, contentKey: contentKey || modelKey, index };
		});
	}

	addSegment(modelKey: string, contentKey: string, index: number): void {
		this.segments.push({ modelKey, contentKey, index });
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
		const path = new UniversalPath(docId);
		if (key) {
			path.addSegment(key, key, 0);
		}
		return path;
	}

	static fromModelAndContentPaths(
		documentId: string,
		modelPath: string,
		contentPath: string,
		numericPath: number[],
		separator: string = '.'
	): UniversalPath {
		const modelParts = modelPath.split(separator);
		const contentParts = contentPath.split('::')[1]?.split(separator) || [];

		if (modelParts.length !== contentParts.length || modelParts.length !== numericPath.length) {
			throw new Error('Model, content, and numeric paths must have the same number of segments');
		}

		const universalPath = new UniversalPath(documentId, undefined, separator);
		for (let i = 0; i < modelParts.length; i++) {
			universalPath.addSegment(modelParts[i], contentParts[i], numericPath[i]);
		}
		return universalPath;
	}
}
