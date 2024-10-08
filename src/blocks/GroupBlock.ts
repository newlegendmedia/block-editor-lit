import { customElement } from 'lit/decorators.js';
import { GroupModel, Model } from '../model/model';
import { IndexedCompositeBlock } from './IndexedCompositeBlock';

@customElement('group-block')
export class GroupBlock extends IndexedCompositeBlock {
	protected getChildModels(): Model[] {
		const model = this.model as GroupModel;
		return model.itemTypes;
	}

	protected getBlockTitle(): string {
		return this.model.name || 'Group Block';
	}

	async connectedCallback() {
		super.connectedCallback();
		// Use capture phase to intercept events before they reach children
		this.addEventListener('keydown', this.handleKeyDown, true);
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this.removeEventListener('keydown', this.handleKeyDown, true);
	}

	private handleKeyDown(event: KeyboardEvent) {
		// Check if the event target is a descendant of this group
		if (event.target instanceof Node && this.contains(event.target)) {
			if (event.key === 'Enter') {
				// Prevent default behavior and stop propagation
				event.preventDefault();
				event.stopPropagation();

				// Handle the Enter key press
				this.handleEnterKeyPress(event.target as HTMLElement);
			}
		}
	}

	private async handleEnterKeyPress(_targetElement: HTMLElement) {
		alert('Enter key pressed in group block clhild');
	}
}
