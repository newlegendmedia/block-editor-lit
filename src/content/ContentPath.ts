// Define SegmentType as an enum for better type safety and readability
export enum SegmentType {
	Document = 'document',
	Key = 'key',
	Index = 'index',
	Parameter = 'parameter',
}

// Enhanced PathSegment with Discriminated Unions and Readonly Properties
export type PathSegment =
	| { readonly type: SegmentType.Document; readonly value: string }
	| { readonly type: SegmentType.Key; readonly value: string }
	| { readonly type: SegmentType.Index; readonly value: string; readonly index: number }
	| { readonly type: SegmentType.Parameter; readonly value: string };

// PathOptions interface remains unchanged
export interface PathOptions {
	separator?: string;
}

// Custom Error Class for ContentPath-related Errors
export class ContentPathError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ContentPathError';
		Object.setPrototypeOf(this, ContentPathError.prototype);
	}
}

/**
 * Class representing a structured content path.
 */
export class ContentPath {
	private readonly segments: ReadonlyArray<PathSegment>;
	private readonly separator: string;
	private cachedPath?: string;
	private cachedSimplePath?: string;

	/**
	 * Constructs a ContentPath instance.
	 * @param path - The path string to parse.
	 * @param key - An optional key to append to the path.
	 * @param options - Optional path options.
	 * @throws Will throw an error if the path does not start with a document ID.
	 */
	constructor(path: string, key?: string, options: PathOptions = {}) {
		this.separator = options.separator ?? '.';
		const parsedSegments = ContentPath.parse(path, this.separator);

		if (key) {
			const keySegment = ContentPath.parseSegment(key);
			this.segments = Object.freeze([...parsedSegments, keySegment]);
		} else {
			this.segments = Object.freeze(parsedSegments);
		}

		if (this.segments[0].type !== SegmentType.Document) {
			throw new ContentPathError('ContentPath must start with a document ID.');
		}
	}

	/**
	 * Parses a path string into PathSegments.
	 * @param path - The path string to parse.
	 * @param separator - The separator used in the path.
	 * @returns An array of PathSegments.
	 * @throws Will throw an error if the path does not start with a document ID.
	 */
	private static parse(path: string, separator: string): ReadonlyArray<PathSegment> {
		const [docId, ...restParts] = path.split('::');
		if (!docId) {
			throw new ContentPathError('ContentPath must start with a document ID.');
		}

		const segments: PathSegment[] = [{ type: SegmentType.Document, value: docId }];

		if (restParts.length > 0) {
			const rest = restParts.join('::'); // Handle cases where '::' might appear in segments
			segments.push(...ContentPath.parseString(rest, separator));
		}

		return Object.freeze(segments);
	}

	/**
	 * Parses the remaining path string after the document ID.
	 * @param path - The remaining path string.
	 * @param separator - The separator used in the path.
	 * @returns An array of PathSegments.
	 */
	private static parseString(path: string, separator: string): PathSegment[] {
		return path.split(separator).filter(Boolean).map(ContentPath.parseSegment);
	}

	/**
	 * Parses an individual segment string into a PathSegment.
	 * @param segmentStr - The segment string to parse.
	 * @returns A PathSegment object.
	 * @throws Will throw an error if the segment format is invalid.
	 */
	private static parseSegment(segmentStr: string): PathSegment {
		const [left, ...rest] = segmentStr.split(':');
		const right = rest.join(':'); // Support segments containing ':'

		if (right) {
			const index = Number(left);
			if (!Number.isInteger(index) || index < 0) {
				throw new ContentPathError(`Invalid index '${left}' in segment '${segmentStr}'.`);
			}
			return { type: SegmentType.Index, value: right, index };
		}

		// Additional parsing logic for other SegmentTypes can be added here
		return { type: SegmentType.Key, value: left };
	}

	/**
	 * Converts a PathSegment array to a path string.
	 * @param segments - The array of PathSegments.
	 * @returns The path string.
	 * @throws Will throw an error if the segments array is empty.
	 */
	private segmentsToString(segments: ReadonlyArray<PathSegment>): string {
		if (segments.length === 0) {
			throw new ContentPathError('Path must have at least one segment.');
		}

		const [documentSegment, ...otherSegments] = segments;
		const serializedSegments = otherSegments
			.map(ContentPath.segmentToStringStatic)
			.join(this.separator);

		return otherSegments.length > 0
			? `${documentSegment.value}::${serializedSegments}`
			: `${documentSegment.value}::`;
	}

	/**
	 * Static method to convert a PathSegment to its string representation.
	 * @param segment - The PathSegment to convert.
	 * @returns The string representation of the segment.
	 */
	private static segmentToStringStatic(segment: PathSegment): string {
		return segment.type === SegmentType.Index ? `${segment.index}:${segment.value}` : segment.value;
	}

	/**
	 * Returns the string representation of the ContentPath.
	 * Utilizes memoization to optimize repeated calls.
	 * @returns The path string.
	 */
	public toString(): string {
		if (!this.cachedPath) {
			this.cachedPath = this.segmentsToString(this.segments);
		}
		return this.cachedPath;
	}

	/**
	 * Returns the path string.
	 */
	public get path(): string {
		return this.toString();
	}

	/**
	 * Returns the key of the last segment.
	 */
	public get key(): string {
		const lastIndex = this.segments.length - 1;
		return lastIndex >= 0 ? this.serializeSegment(this.segments[lastIndex]) : '';
	}

	/**
	 * Returns the parent path string.
	 * @throws Will throw an error if attempting to get the parent of the root.
	 */
	public get parentPath(): string {
		if (this.segments.length <= 1) {
			throw new ContentPathError('Cannot get parent path of the root segment.');
		}

		const parentSegments = this.segments.slice(0, -1);
		const parentPath = this.segmentsToString(parentSegments);
		return parentPath;
	}

	/**
	 * Returns the key of the parent segment.
	 * @returns The parent key or an empty string if there is no parent key.
	 */
	public get parentKey(): string {
		return this.segments.length > 2 ? this.segments[this.segments.length - 2].value : '';
	}

	/**
	 * Returns the document ID of the path.
	 */
	public get document(): string {
		return this.segments[0].value;
	}

	/**
	 * Returns the simple path string, excluding the document segment and removing colons from segments.
	 * @returns The simple path string.
	 */
	public get simplePath(): string {
		if (!this.cachedSimplePath) {
			this.cachedSimplePath = this.segments
				.slice(1)
				.map((segment) => segment.value)
				.join(this.separator);
		}
		return this.cachedSimplePath;
	}

	/**
	 * Returns the simple key of the last segment, excluding the document and removing colons.
	 * @returns The simple key string.
	 */
	public get simpleKey(): string {
		const lastIndex = this.segments.length - 1;
		return lastIndex >= 0 ? this.segments[lastIndex].value : '';
	}

	/**
	 * Returns the simple parent path, excluding the document segment and removing colons from segments.
	 * @throws Will throw an error if attempting to get the parent of the root segment.
	 */
	public get simpleParentPath(): string {
		if (this.segments.length <= 1) {
			throw new ContentPathError('Cannot get parent path of the root segment.');
		}

		const parentSegments = this.segments.slice(1, -1);
		return parentSegments.map((segment) => segment.value).join(this.separator);
	}

	/**
	 * Serializes a PathSegment into its full string representation.
	 * For Index segments, includes the index followed by a colon and the value.
	 * For other segments, returns the value directly.
	 * @param segment - The PathSegment to serialize.
	 * @returns The serialized string of the segment.
	 */
	public serializeSegment(segment: PathSegment): string {
		return segment.type === SegmentType.Index ? `${segment.index}:${segment.value}` : segment.value;
	}

	/**
	 * Creates a ContentPath instance from a document ID and an optional key.
	 * @param docId - The document ID.
	 * @param key - An optional key to append.
	 * @param options - Optional path options.
	 * @returns A new ContentPath instance.
	 */
	public static fromDocumentId(
		docId: string,
		key?: string,
		options: PathOptions = {}
	): ContentPath {
		const path = `${docId}::`;
		return new ContentPath(path, key, options);
	}

	/**
	 * Returns the path segements array
	 */
	public get pathSegments(): readonly PathSegment[] {
		return this.segments;
	}

	/**
	 * Retrieves a subpath up to the specified end index.
	 * @param endIndex - The index up to which the subpath is extracted.
	 * @returns The subpath string.
	 * @throws Will throw an error if endIndex is out of bounds.
	 */
	public getSubPath(endIndex: number): string {
		if (endIndex < 0 || endIndex >= this.segments.length) {
			throw new ContentPathError('Invalid endIndex for subpath extraction.');
		}

		const subSegments = this.segments.slice(0, endIndex + 1);
		return this.segmentsToString(subSegments);
	}
}
