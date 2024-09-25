enum SegmentType {
	Document = 'document',
	Key = 'key',
	Index = 'index',
	Parameter = 'parameter',
}

type UnifiedPathSegment = {
	type: SegmentType;
	contentValue: string;
	modelValue: string;
	index?: number;
};

interface PathOptions {
	separator?: string;
}

class UnifiedPath {
	private readonly segments: ReadonlyArray<UnifiedPathSegment>;
	private readonly separator: string;
	private cachedContentPath?: string;
	private cachedModelPath?: string;
	private cachedUnifiedPath?: string;

	constructor(path: string, options: PathOptions = {}) {
		this.separator = options.separator ?? '.';
		this.segments = Object.freeze(UnifiedPath.parse(path, this.separator));

		if (this.segments[0].type !== SegmentType.Document) {
			throw new Error('UnifiedPath must start with a document ID.');
		}
	}

	private static parse(path: string, separator: string): ReadonlyArray<UnifiedPathSegment> {
		const [docId, ...restParts] = path.split('::');
		if (!docId) {
			throw new Error('UnifiedPath must start with a document ID.');
		}

		const segments: UnifiedPathSegment[] = [
			{
				type: SegmentType.Document,
				contentValue: docId,
				modelValue: docId, // Assuming document ID is the same for both content and model
			},
		];

		if (restParts.length > 0) {
			const rest = restParts.join('::');
			segments.push(...UnifiedPath.parseString(rest, separator));
		}

		return Object.freeze(segments);
	}

	private static parseString(path: string, separator: string): UnifiedPathSegment[] {
		return path.split(separator).filter(Boolean).map(UnifiedPath.parseSegment);
	}

	private static parseSegment(segmentStr: string): UnifiedPathSegment {
		const [left, ...rest] = segmentStr.split(':');
		const right = rest.join(':');

		if (right) {
			const [contentValue, modelValue] = right.split('|');
			const index = Number(left);
			if (!Number.isInteger(index) || index < 0) {
				throw new Error(`Invalid index '${left}' in segment '${segmentStr}'.`);
			}
			return { type: SegmentType.Index, contentValue, modelValue, index };
		}

		const [contentValue, modelValue] = left.split('|');
		return { type: SegmentType.Key, contentValue, modelValue };
	}

	toString(): string {
		if (!this.cachedUnifiedPath) {
			this.cachedUnifiedPath = this.segmentsToString(this.segments);
		}
		return this.cachedUnifiedPath;
	}

	toContentPath(): string {
		if (!this.cachedContentPath) {
			this.cachedContentPath = this.segmentsToString(this.segments, 'content');
		}
		return this.cachedContentPath;
	}

	toModelPath(): string {
		if (!this.cachedModelPath) {
			this.cachedModelPath = this.segmentsToString(this.segments, 'model');
		}
		return this.cachedModelPath;
	}

	private segmentsToString(
		segments: ReadonlyArray<UnifiedPathSegment>,
		pathType: 'unified' | 'content' | 'model' = 'unified'
	): string {
		if (segments.length === 0) {
			throw new Error('Path must have at least one segment.');
		}

		const [documentSegment, ...otherSegments] = segments;
		const serializedSegments = otherSegments
			.map((segment) => UnifiedPath.segmentToString(segment, pathType))
			.join(this.separator);

		return otherSegments.length > 0
			? `${documentSegment.contentValue}::${serializedSegments}`
			: `${documentSegment.contentValue}::`;
	}

	private static segmentToString(
		segment: UnifiedPathSegment,
		pathType: 'unified' | 'content' | 'model'
	): string {
		if (segment.type === SegmentType.Index) {
			const value = pathType === 'model' ? segment.modelValue : segment.contentValue;
			return `${segment.index}:${value}`;
		}
		if (pathType === 'unified') {
			return `${segment.contentValue}|${segment.modelValue}`;
		}
		return pathType === 'model' ? segment.modelValue : segment.contentValue;
	}

	get contentPath(): string {
		return this.toContentPath();
	}

	get modelPath(): string {
		return this.toModelPath();
	}

	get parentPath(): UnifiedPath {
		if (this.segments.length <= 1) {
			throw new Error('Cannot get parent path of the root segment.');
		}

		const parentSegments = this.segments.slice(0, -1);
		return new UnifiedPath(this.segmentsToString(parentSegments), { separator: this.separator });
	}

	get document(): string {
		return this.segments[0].contentValue;
	}

	static fromParts(contentPath: string, modelPath: string, options: PathOptions = {}): UnifiedPath {
		const contentParts = contentPath.split('::');
		const modelParts = modelPath.split('::');

		if (contentParts[0] !== modelParts[0]) {
			throw new Error('Content and model paths must have the same document ID.');
		}

		const combinedParts = contentParts[1].split('.').map((part, index) => {
			const modelPart = modelParts[1].split('.')[index];
			return `${part}|${modelPart}`;
		});

		return new UnifiedPath(`${contentParts[0]}::${combinedParts.join('.')}`, options);
	}
}
