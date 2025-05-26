// Create a simple browser-compatible event emitter replacement
class EventEmitter {
  private events: { [key: string]: Function[] } = {};

  on(event: string, listener: Function): this {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return this;
  }
  
  off(event: string, listener: Function): this {
    if (!this.events[event]) return this;
    
    this.events[event] = this.events[event].filter(l => l !== listener);
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    const eventListeners = this.events[event];
    if (!eventListeners) return false;
    
    eventListeners.forEach(listener => {
      listener(...args);
    });
    return true;
  }
}

export type BreakpointLocation = {
  lineNumber: number;
  columnNumber?: number;
};

export type DebuggerVariable = {
  name: string;
  value: any;
  type: string;
};

export type DebuggerState = {
  isRunning: boolean;
  isPaused: boolean;
  currentLine: number | null;
  callStack: string[];
  variables: DebuggerVariable[];
  error: string | null;
};

export type ConsoleMessage = {
  id: string;
  type: 'log' | 'error' | 'warn' | 'info';
  content: string;
  timestamp: number;
};

class DebuggerService extends EventEmitter {
  private breakpoints: Map<number, boolean> = new Map();
  private state: DebuggerState = {
    isRunning: false,
    isPaused: false,
    currentLine: null,
    callStack: [],
    variables: [],
    error: null
  };
  private console: ConsoleMessage[] = [];
  private originalConsole: {
    log: typeof console.log;
    error: typeof console.error;
    warn: typeof console.warn;
    info: typeof console.info;
  } = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info
  };
  private sourceCode: string = '';
  private sourceLines: string[] = [];

  constructor() {
    super();
  }

  // Initialize the debugger with new code
  public initialize(code: string): void {
    this.resetState();
    this.sourceCode = code;
    this.sourceLines = code.split('\n');
    this.emit('stateChanged', this.state);
    this.clearConsole();
  }

  // Add or remove a breakpoint
  public toggleBreakpoint(line: number): boolean {
    const isSet = this.breakpoints.get(line);
    this.breakpoints.set(line, !isSet);
    this.emit('breakpointsChanged', this.getBreakpoints());
    return !isSet;
  }

  // Get all current breakpoints
  public getBreakpoints(): BreakpointLocation[] {
    return Array.from(this.breakpoints.entries())
      .filter(([_, isSet]) => isSet)
      .map(([line]) => ({ lineNumber: line }));
  }

  // Start debugging
  public start(): void {
    if (this.state.isRunning) return;
    
    this.resetState();
    this.state.isRunning = true;
    this.state.currentLine = 1;
    this.emit('stateChanged', { ...this.state });
    
    // Simulate execution by pausing at the first breakpoint or line 1
    if (this.breakpoints.get(1)) {
      this.state.isPaused = true;
      this.updateVariables(1);
    }
    
    this.emit('stateChanged', { ...this.state });
  }

  // Pause execution
  public pause(): void {
    if (!this.state.isRunning || this.state.isPaused) return;
    
    this.state.isPaused = true;
    this.emit('stateChanged', { ...this.state });
  }

  // Resume execution
  public resume(): void {
    if (!this.state.isRunning || !this.state.isPaused) return;
    
    this.state.isPaused = false;
    this.emit('stateChanged', { ...this.state });
    
    // Simulate continuing to the next breakpoint or end
    this.simulateContinueExecution();
  }

  // Step to the next line
  public stepOver(): void {
    if (!this.state.isRunning || !this.state.isPaused) return;
    
    const nextLine = (this.state.currentLine || 0) + 1;
    if (nextLine <= this.sourceLines.length) {
      this.state.currentLine = nextLine;
      this.updateVariables(nextLine);
      this.emit('stateChanged', { ...this.state });
      
      // If this line has a breakpoint, pause here
      if (this.breakpoints.get(nextLine)) {
        this.state.isPaused = true;
      }
    } else {
      this.stop();
    }
  }

  // Simplified step into (just advances one line for now)
  public stepInto(): void {
    this.stepOver();
  }

  // Simplified step out (just advances one line for now)
  public stepOut(): void {
    this.stepOver();
  }

  // Stop debugging
  public stop(): void {
    this.resetState();
    this.emit('stateChanged', { ...this.state });
  }

  // Get current debugger state
  public getState(): DebuggerState {
    return { ...this.state };
  }

  // Get console messages
  public getConsoleMessages(): ConsoleMessage[] {
    return [...this.console];
  }

  // Clear console messages
  public clearConsole(): void {
    this.console = [];
    this.emit('consoleCleared');
  }

  // Add a console message
  public addConsoleMessage(type: 'log' | 'error' | 'warn' | 'info', content: string): void {
    const message: ConsoleMessage = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      type,
      content,
      timestamp: Date.now()
    };
    
    this.console.push(message);
    this.emit('consoleMessage', message);
  }

  // Private methods
  private resetState(): void {
    this.state = {
      isRunning: false,
      isPaused: false,
      currentLine: null,
      callStack: [],
      variables: [],
      error: null
    };
    
    // Don't clear breakpoints or console when resetting state
  }

  private updateVariables(lineNumber: number): void {
    // This is a simplified implementation - would normally extract variables from the current scope
    const line = this.sourceLines[lineNumber - 1] || '';
    
    // Very basic variable extraction (just for demonstration)
    const varDeclarationMatch = line.match(/(?:let|const|var)\s+(\w+)\s*=\s*(.+?);/);
    if (varDeclarationMatch) {
      const [_, name, valueStr] = varDeclarationMatch;
      let value: any;
      let type: string;
      
      try {
        // Very simplistic evaluation
        if (valueStr.startsWith('"') || valueStr.startsWith("'")) {
          value = valueStr.slice(1, -1); // Remove quotes
          type = 'string';
        } else if (valueStr === 'true' || valueStr === 'false') {
          value = valueStr === 'true';
          type = 'boolean';
        } else if (!isNaN(Number(valueStr))) {
          value = Number(valueStr);
          type = 'number';
        } else {
          value = valueStr;
          type = 'unknown';
        }
        
        this.state.variables.push({ name, value, type });
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }

  private simulateContinueExecution(): void {
    if (!this.state.isRunning) return;
    
    let currentLine = this.state.currentLine || 1;
    const totalLines = this.sourceLines.length;
    
    // Find the next breakpoint or go to the end
    let nextBreakpoint = null;
    for (let line = currentLine + 1; line <= totalLines; line++) {
      if (this.breakpoints.get(line)) {
        nextBreakpoint = line;
        break;
      }
    }
    
    if (nextBreakpoint) {
      this.state.currentLine = nextBreakpoint;
      this.state.isPaused = true;
      this.updateVariables(nextBreakpoint);
    } else {
      // No more breakpoints, finish execution
      this.stop();
    }
    
    this.emit('stateChanged', { ...this.state });
  }
}

// Create a singleton instance
const debuggerService = new DebuggerService();

// Export the singleton
export default debuggerService;