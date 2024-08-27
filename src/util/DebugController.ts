import { ReactiveController, ReactiveControllerHost, html } from 'lit';

class DebugState {
    private _showDebugButtons: boolean = false;
    private _useDebugController: boolean = false;  // New setting
    private listeners: Set<() => void> = new Set();

    get showDebugButtons(): boolean {
        return this._showDebugButtons;
    }

    set showDebugButtons(value: boolean) {
        this._showDebugButtons = value;
        this.notifyListeners();
    }

    get useDebugController(): boolean {
        return this._useDebugController;
    }

    set useDebugController(value: boolean) {
        this._useDebugController = value;
        this.notifyListeners();
    }

	addListener(listener: () => void) {
        this.listeners.add(listener);
    }

    removeListener(listener: () => void) {
        this.listeners.delete(listener);
    }

    private notifyListeners() {
        this.listeners.forEach(listener => listener());
    }
}

export const globalDebugState = new DebugState();

export class DebugController implements ReactiveController {
    private host: ReactiveControllerHost;
    private debugInfo: Record<string, any> = {};

    constructor(host: ReactiveControllerHost) {
        this.host = host;
        globalDebugState.addListener(() => this.host.requestUpdate());
        host.addController(this);
	}
	
    hostConnected() {}
    hostDisconnected() {
        globalDebugState.removeListener(() => this.host.requestUpdate());
    }

    setDebugInfo(info: Record<string, any>) {
        if (globalDebugState.useDebugController) {
            this.debugInfo = this.sanitizeObject(info);
        }
    }

    private sanitizeObject(obj: any): any {
        const seen = new WeakSet();
        return JSON.parse(JSON.stringify(obj, (_key, value) => {
            if (typeof value === "object" && value !== null) {
                // if (seen.has(value)) {
                //     return "[Circular]";
                // }
                seen.add(value);
            }
            return value;
        }));
    }

    get showDebugButtons(): boolean {
        return globalDebugState.showDebugButtons;
    }

    toggleDebugButtons() {
        globalDebugState.showDebugButtons = !globalDebugState.showDebugButtons;
    }

    renderDebugButton() {
        if (!globalDebugState.useDebugController) return '';
        return html`
            <button @click=${this.toggleDebugButtons}>
                ${this.showDebugButtons ? 'Hide' : 'Show'} Debug Info
            </button>
        `;
    }

    renderDebugInfo() {
        if (!globalDebugState.useDebugController || !this.showDebugButtons) return '';
        return html`
            <div class="debug-info">
                <h4>Debug Information</h4>
                <pre>${JSON.stringify(this.debugInfo, null, 2)}</pre>
            </div>
        `;
    }
}