export type PathSegment = {
	modelKey: string;
	contentKey: string;
	index: number;
};

export class UniversalPath {
	private static readonly SEPARATOR: string = '.';
	private readonly segments: PathSegment[];
	private readonly documentId: string;
	private static enableLogging: boolean = false;

	public static setLogging(enabled: boolean): void {
		UniversalPath.enableLogging = enabled;
	}

	private constructor(documentId: string, segments: PathSegment[]) {
		this.documentId = documentId;
		this.segments = segments;

		if (UniversalPath.enableLogging) {
			console.log('UniversalPath Initialized:', this.toString(), this);
		}
	}

	public static fromFullPath(
		fullPath: string,
		modelKey?: string,
		contentKey?: string
	): UniversalPath {
		if (!fullPath.includes('::')) {
			throw new Error('UniversalPath must contain a document ID separated by "::"');
		}

		const [docIdPart, ...pathParts] = fullPath.split('::');
		const documentId = docIdPart;

		let segments: PathSegment[] = [];

		if (pathParts.length > 0 && pathParts[0].length > 0) {
			const remainingPath = pathParts.join('::');
			segments = UniversalPath.parsePath(remainingPath);
		}

		if (modelKey) {
			contentKey = contentKey || modelKey;
			UniversalPath.validateKey(modelKey, 'modelKey');
			UniversalPath.validateKey(contentKey, 'contentKey');
			segments = [...segments, UniversalPath.createSegment(modelKey, contentKey, segments.length)];
		}

		return new UniversalPath(documentId, segments);
	}

	public static fromDocumentId(docId: string, key?: string): UniversalPath {
		UniversalPath.validateDocId(docId);
		let segments: PathSegment[] = [];

		if (key) {
			UniversalPath.validateKey(key, 'key');
			segments.push(UniversalPath.createSegment(key, key, 0));
		}

		return new UniversalPath(docId, segments);
	}

	private static parsePath(pathString: string): PathSegment[] {
		const parts = pathString.split(UniversalPath.SEPARATOR);
		return parts.map((part, index) => {
			const [modelKey, contentKey] = part.split(':');
			UniversalPath.validateKey(modelKey, `modelKey at segment ${index}`);
			if (contentKey) {
				UniversalPath.validateKey(contentKey, `contentKey at segment ${index}`);
			}
			return {
				modelKey,
				contentKey: contentKey || modelKey,
				index,
			};
		});
	}

	private static createSegment(modelKey: string, contentKey: string, index: number): PathSegment {
		return { modelKey, contentKey, index };
	}

	private static validateKey(key: string, keyName: string): void {
		const keyPattern = /^[A-Za-z0-9_-]+$/;
		if (!keyPattern.test(key)) {
			throw new Error(
				`Invalid ${keyName}: "${key}". Only alphanumeric characters, underscores, and hyphens are allowed.`
			);
		}
	}

	private static validateDocId(docId: string): void {
		if (!docId || typeof docId !== 'string') {
			throw new Error('Document ID must be a non-empty string.');
		}
	}

	public addSegment(modelKey: string, contentKey?: string): UniversalPath {
		contentKey = contentKey || modelKey;
		UniversalPath.validateKey(modelKey, 'modelKey');
		UniversalPath.validateKey(contentKey, 'contentKey');

		const newSegment: PathSegment = UniversalPath.createSegment(
			modelKey,
			contentKey,
			this.segments.length
		);

		const newSegments = [...this.segments, newSegment];

		return new UniversalPath(this.documentId, newSegments);
	}

	public get segmentsReadonly(): ReadonlyArray<PathSegment> {
		return this.segments;
	}

	public get path(): string {
		return this.segments
			.map((segment) =>
				segment.modelKey === segment.contentKey
					? segment.modelKey
					: `${segment.modelKey}:${segment.contentKey}`
			)
			.join(UniversalPath.SEPARATOR);
	}

	public get modelPath(): string {
		return this.segments.map((segment) => segment.modelKey).join(UniversalPath.SEPARATOR);
	}

	public get contentPath(): string {
		return `${this.documentId}::${this.segments.map((segment) => segment.contentKey).join(UniversalPath.SEPARATOR)}`;
	}

	public get numericPath(): number[] {
		return this.segments.map((segment) => segment.index);
	}

	public get numericParentPath(): number[] {
		return this.segments.slice(0, -1).map((segment) => segment.index);
	}

	public get modelParent(): string {
		return this.segments
			.slice(0, -1)
			.map((segment) => segment.modelKey)
			.join(UniversalPath.SEPARATOR);
	}

	public get contentParent(): string {
		const parentSegments = this.segments.slice(0, -1);
		return parentSegments.length > 0
			? `${this.documentId}::${parentSegments.map((segment) => segment.contentKey).join(UniversalPath.SEPARATOR)}`
			: `${this.documentId}::`;
	}

	public get modelKey(): string {
		return this.segments[this.segments.length - 1]?.modelKey || '';
	}

	public get contentKey(): string {
		return this.segments[this.segments.length - 1]?.contentKey || '';
	}

	public get document(): string {
		return this.documentId;
	}

	public toString(): string {
		return this.contentPath;
	}

	public toJSON(): string {
		return this.toString();
	}

	public isDocumentRoot(): boolean {
		return this.segments.length === 0;
	}

	public createChild(modelKey: string, contentKey?: string): UniversalPath {
		return this.addSegment(modelKey, contentKey);
	}

	public getParent(): UniversalPath {
		if (this.segments.length === 0) {
			return this;
		}
		const parentSegments = this.segments.slice(0, -1);
		return new UniversalPath(this.documentId, parentSegments);
	}
}
