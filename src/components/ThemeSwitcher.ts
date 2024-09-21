import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement('theme-switcher')
export class ThemeSwitcher extends LitElement {
	@property({ type: Boolean }) darkMode = true;

	static styles = css`
		:host {
			display: inline-block;
		}
		button {
			background-color: var(--primary-color);
			color: var(--text-color);
			border: none;
			padding: 7px 15px;
			cursor: pointer;
			border-radius: 5px;
		}
	`;

	render() {
		alert('ThemeSwitcher render');
		return html`
			<button @click=${this.toggleTheme}>${this.darkMode ? 'Light Mode' : 'Dark Mode'}</button>
		`;
	}

	toggleTheme() {
		this.darkMode = !this.darkMode;
		document.body.classList.toggle('dark-theme', this.darkMode);
		// Dispatch an event so other components can react to the theme change if needed
		this.dispatchEvent(
			new CustomEvent('theme-changed', {
				detail: { darkMode: this.darkMode },
				bubbles: true,
				composed: true,
			})
		);
	}
}
