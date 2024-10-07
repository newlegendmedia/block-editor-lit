// AppState.ts
import { DocumentId } from '../content/content';

export interface AppState {
	activeDocumentId: DocumentId | null;
	isSidebarOpen: boolean;
	isDarkMode: boolean;
	currentPath: string | null; // This is now a string representation of UniversalPath
	pathRenderError: string | null;
	isLoading: boolean;
}

export const initialState: AppState = {
	activeDocumentId: null,
	isSidebarOpen: true,
	isDarkMode: false,
	currentPath: null,
	pathRenderError: null,
	isLoading: false,
};
