//import { UnifedPathSegment } from './UnifiedPathSegment';

class UnifiedPathSegmentX {
	constructor(
		public modelKey: string,
		public contentId: string,
		public name: string,
		public index?: number
	) {}
}

class UnifiedPathAdapter {
	constructor(public segments: UnifiedPathSegmentX[]) {}

	static fromExistingPaths(contentPath: string, modelPath: string): UnifiedPathAdapter {
		// Parse existing paths into UniversalPathSegments
		const contentSegments = contentPath.split('/');
		const modelSegments = modelPath.split('/');

		return new UnifiedPathAdapter(
			contentSegments.map((contentKey, index) => ({
				modelKey: modelSegments[index] || '',
				contentKey,
				displayKey: modelSegments[index] || contentKey,
			}))
		);
	}

	getContentPath(): string {
		return this.segments.map((s) => s.contentKey).join('/');
	}

	getModelPath(): string {
		return this.segments.map((s) => s.modelKey).join('/');
	}

	// ... other methods from UniversalPath
}
