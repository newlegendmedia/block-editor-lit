import { css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { Model, ObjectModel } from '../model/model';
import { KeyedCompositeBlock } from './KeyedCompositeBlock';

@customElement('object-block')
export class ObjectBlock extends KeyedCompositeBlock {
	static styles = [
		...KeyedCompositeBlock.styles,
		css`
			.object-content {
				display: flex;
				flex-direction: column;
				gap: var(--spacing-small);
			}
			.property-content {
				flex: 1;
			}
			.property-item {
				display: flex;
				flex-direction: column;
				gap: var(--spacing-small);
				margin-top: var(--spacing-small);
			}
		`,
	];

	protected getChildModels(): Model[] {
		const properties = (this.model as ObjectModel)?.properties || [];
		return properties;
	}

	protected getBlockTitle(): string {
		return (this.model as ObjectModel).name || 'Object';
	}
}
