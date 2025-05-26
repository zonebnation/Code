import { EditorSettings } from '../context/SettingsContext';

export type KeyCombo = {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
};

export type KeyBinding = {
  id: string;
  action: string;
  category: string;
  description: string;
  defaultKeyCombo: KeyCombo;
  currentKeyCombo: KeyCombo;
  scope?: 'global' | 'editor' | 'terminal' | 'explorer';
};

class KeyBindingsService {
  private bindings: Map<string, KeyBinding> = new Map();
  private handlers: Map<string, () => void> = new Map();
  private activeScope: string = 'global';
  private enabled: boolean = true;
  
  constructor() {
    this.setupDefaultBindings();
    this.loadCustomBindings();
    this.setupGlobalListeners();
  }
  
  setupDefaultBindings() {
    // Editor bindings
    this.registerBinding({
      id: 'editor.save',
      action: 'Save',
      category: 'Editor',
      description: 'Save the current file',
      defaultKeyCombo: { key: 's', ctrl: true },
      scope: 'editor'
    });
    
    this.registerBinding({
      id: 'editor.format',
      action: 'Format Document',
      category: 'Editor',
      description: 'Format the current document',
      defaultKeyCombo: { key: 'f', alt: true, shift: true },
      scope: 'editor'
    });
    
    this.registerBinding({
      id: 'editor.find',
      action: 'Find',
      category: 'Editor',
      description: 'Find in current file',
      defaultKeyCombo: { key: 'f', ctrl: true },
      scope: 'editor'
    });
    
    this.registerBinding({
      id: 'editor.replace',
      action: 'Replace',
      category: 'Editor',
      description: 'Find and replace in current file',
      defaultKeyCombo: { key: 'h', ctrl: true },
      scope: 'editor'
    });
    
    this.registerBinding({
      id: 'editor.toggleMinimap',
      action: 'Toggle Minimap',
      category: 'Editor',
      description: 'Show or hide the code minimap',
      defaultKeyCombo: { key: 'm', alt: true },
      scope: 'editor'
    });
    
    // Global bindings
    this.registerBinding({
      id: 'global.commandPalette',
      action: 'Open Command Palette',
      category: 'Global',
      description: 'Open the command palette',
      defaultKeyCombo: { key: 'p', ctrl: true, shift: true },
      scope: 'global'
    });
    
    this.registerBinding({
      id: 'global.search',
      action: 'Global Search',
      category: 'Global',
      description: 'Search across all files',
      defaultKeyCombo: { key: 'f', ctrl: true, shift: true },
      scope: 'global'
    });
    
    this.registerBinding({
      id: 'global.toggleTheme',
      action: 'Toggle Dark Mode',
      category: 'Global',
      description: 'Switch between light and dark themes',
      defaultKeyCombo: { key: 't', alt: true, shift: true },
      scope: 'global'
    });
    
    this.registerBinding({
      id: 'global.shortcuts',
      action: 'Show Keyboard Shortcuts',
      category: 'Global',
      description: 'Show keyboard shortcuts reference',
      defaultKeyCombo: { key: 'k', ctrl: true, shift: true },
      scope: 'global'
    });
    
    // Terminal bindings
    this.registerBinding({
      id: 'terminal.clear',
      action: 'Clear Terminal',
      category: 'Terminal',
      description: 'Clear the terminal output',
      defaultKeyCombo: { key: 'l', ctrl: true },
      scope: 'terminal'
    });
    
    this.registerBinding({
      id: 'terminal.run',
      action: 'Run Current File',
      category: 'Terminal',
      description: 'Run the currently active file',
      defaultKeyCombo: { key: 'r', alt: true, shift: true },
      scope: 'terminal'
    });
    
    // Explorer bindings
    this.registerBinding({
      id: 'explorer.newFile',
      action: 'New File',
      category: 'Explorer',
      description: 'Create a new file',
      defaultKeyCombo: { key: 'n', alt: true },
      scope: 'explorer'
    });
    
    this.registerBinding({
      id: 'explorer.newFolder',
      action: 'New Folder',
      category: 'Explorer',
      description: 'Create a new folder',
      defaultKeyCombo: { key: 'n', alt: true, shift: true },
      scope: 'explorer'
    });
  }
  
  registerBinding(binding: Omit<KeyBinding, 'currentKeyCombo'>) {
    const fullBinding: KeyBinding = {
      ...binding,
      currentKeyCombo: { ...binding.defaultKeyCombo }
    };
    
    this.bindings.set(binding.id, fullBinding);
  }
  
  registerHandler(id: string, handler: () => void) {
    this.handlers.set(id, handler);
    return () => this.handlers.delete(id);
  }
  
  setScope(scope: string) {
    this.activeScope = scope;
  }
  
  enableKeyBindings() {
    this.enabled = true;
  }
  
  disableKeyBindings() {
    this.enabled = false;
  }
  
  private setupGlobalListeners() {
    window.addEventListener('keydown', this.handleKeyDown);
  }
  
  private handleKeyDown = (e: KeyboardEvent) => {
    if (!this.enabled) return;
    
    // Skip if in form elements, unless explicitly allowed
    if (
      ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as Element)?.tagName) && 
      !(e.target as HTMLElement)?.classList.contains('allow-keybindings')
    ) {
      return;
    }
    
    // Look for matching bindings
    for (const [id, binding] of this.bindings.entries()) {
      // Only consider bindings for the current scope or global scope
      if (binding.scope !== 'global' && binding.scope !== this.activeScope) continue;
      
      if (this.isKeyComboMatch(e, binding.currentKeyCombo)) {
        const handler = this.handlers.get(id);
        if (handler) {
          e.preventDefault();
          handler();
          return;
        }
      }
    }
  }
  
  private isKeyComboMatch(event: KeyboardEvent, combo: KeyCombo): boolean {
    const keyMatch = event.key.toLowerCase() === combo.key.toLowerCase();
    const ctrlMatch = Boolean(combo.ctrl) === event.ctrlKey;
    const altMatch = Boolean(combo.alt) === event.altKey;
    const shiftMatch = Boolean(combo.shift) === event.shiftKey;
    const metaMatch = Boolean(combo.meta) === event.metaKey;
    
    return keyMatch && ctrlMatch && altMatch && shiftMatch && metaMatch;
  }
  
  getAllBindings(): KeyBinding[] {
    return Array.from(this.bindings.values());
  }
  
  getBindingsByScope(scope: string): KeyBinding[] {
    return Array.from(this.bindings.values())
      .filter(binding => binding.scope === scope || binding.scope === 'global');
  }
  
  getBinding(id: string): KeyBinding | undefined {
    return this.bindings.get(id);
  }
  
  updateBinding(id: string, keyCombo: KeyCombo): boolean {
    const binding = this.bindings.get(id);
    if (binding) {
      binding.currentKeyCombo = { ...keyCombo };
      this.bindings.set(id, binding);
      this.saveCustomBindings();
      return true;
    }
    return false;
  }
  
  resetBinding(id: string): boolean {
    const binding = this.bindings.get(id);
    if (binding) {
      binding.currentKeyCombo = { ...binding.defaultKeyCombo };
      this.bindings.set(id, binding);
      this.saveCustomBindings();
      return true;
    }
    return false;
  }
  
  resetAllBindings(): void {
    for (const [id, binding] of this.bindings.entries()) {
      binding.currentKeyCombo = { ...binding.defaultKeyCombo };
      this.bindings.set(id, binding);
    }
    this.saveCustomBindings();
  }
  
  private loadCustomBindings(): void {
    try {
      const stored = localStorage.getItem('keyBindings');
      if (!stored) return;
      
      const customBindings = JSON.parse(stored) as Record<string, KeyCombo>;
      for (const [id, keyCombo] of Object.entries(customBindings)) {
        const binding = this.bindings.get(id);
        if (binding) {
          binding.currentKeyCombo = keyCombo;
          this.bindings.set(id, binding);
        }
      }
    } catch (error) {
      console.error('Error loading custom key bindings:', error);
    }
  }
  
  private saveCustomBindings(): void {
    try {
      const customBindings: Record<string, KeyCombo> = {};
      
      for (const [id, binding] of this.bindings.entries()) {
        if (JSON.stringify(binding.currentKeyCombo) !== JSON.stringify(binding.defaultKeyCombo)) {
          customBindings[id] = binding.currentKeyCombo;
        }
      }
      
      localStorage.setItem('keyBindings', JSON.stringify(customBindings));
    } catch (error) {
      console.error('Error saving custom key bindings:', error);
    }
  }
  
  formatKeyCombo(combo: KeyCombo): string {
    const parts: string[] = [];
    
    if (combo.ctrl) parts.push('Ctrl');
    if (combo.alt) parts.push('Alt');
    if (combo.shift) parts.push('Shift');
    if (combo.meta) parts.push('Meta');
    
    let key = combo.key;
    if (key === ' ') key = 'Space';
    if (key.length === 1) key = key.toUpperCase();
    
    parts.push(key);
    
    return parts.join('+');
  }
  
  parseKeyCombo(str: string): KeyCombo | null {
    const parts = str.split('+').map(p => p.trim());
    
    if (parts.length === 0) return null;
    
    const combo: KeyCombo = {
      key: parts[parts.length - 1].toLowerCase()
    };
    
    if (parts.includes('Ctrl')) combo.ctrl = true;
    if (parts.includes('Alt')) combo.alt = true;
    if (parts.includes('Shift')) combo.shift = true;
    if (parts.includes('Meta')) combo.meta = true;
    
    // Handle special key names
    if (combo.key === 'space') combo.key = ' ';
    
    return combo;
  }
  
  cleanup(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
  }
}

const keyBindingsService = new KeyBindingsService();
export default keyBindingsService;