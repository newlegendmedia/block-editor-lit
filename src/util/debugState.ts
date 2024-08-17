// debugState.ts

class DebugState {
    private _showDebugButtons: boolean = false;
  
    get showDebugButtons(): boolean {
      return this._showDebugButtons;
    }
  
    set showDebugButtons(value: boolean) {
      console.log(`Debug state changing to: ${value}`);
      this._showDebugButtons = value;
      this.notifyListeners();
    }
  
    private listeners: Set<() => void> = new Set();
  
    addListener(listener: () => void) {
      this.listeners.add(listener);
      console.log(`Listener added. Total listeners: ${this.listeners.size}`);
    }
  
    removeListener(listener: () => void) {
      this.listeners.delete(listener);
      console.log(`Listener removed. Total listeners: ${this.listeners.size}`);
    }
  
    private notifyListeners() {
      console.log(`Notifying ${this.listeners.size} listeners`);
      this.listeners.forEach(listener => listener());
    }
  }
  
  const globalDebugState = new DebugState();
  
  export { globalDebugState, DebugState };