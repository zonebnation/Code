import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useProject } from '../context/ProjectContext';
import { 
  ChevronRight,
  ArrowUp, 
  ArrowDown, 
  X, 
  Terminal as TerminalIcon, 
  Play, 
  PackageOpen, 
  Clipboard,
  Bug
} from 'lucide-react';
import EmptyState from '../components/shared/EmptyState';
import TerminalService, { CommandResult } from '../services/TerminalService';
import EnhancedConsoleOutput from '../components/Terminal/EnhancedConsoleOutput';
import keyBindingsService from '../services/KeyBindingsService';
import styles from './TerminalScreen.module.css';

type TerminalLine = {
  id: string;
  content: string;
  isCommand: boolean;
  isError?: boolean;
  isHtml?: boolean;
};

type ConsoleMessage = {
  id: string;
  type: 'log' | 'error' | 'warn' | 'info' | 'system';
  content: string;
  timestamp: number;
};

const TerminalScreen = () => {
  const { colors } = useTheme();
  const { 
    currentProject, 
    createNewFile, 
    createNewFolder, 
    deleteFile, 
    saveFile,
    findFileById,
    currentFile
  } = useProject();
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<TerminalLine[]>([
    { id: '1', content: 'Code Canvas Terminal v1.0.0', isCommand: false },
    { id: '2', content: 'Node.js v18.16.1 is available! Try running `node -v`', isCommand: false },
    { id: '3', content: 'Type "help" for available commands', isCommand: false },
  ]);
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([
    { 
      id: '1', 
      type: 'system', 
      content: 'Console ready. Run your code to see output here.',
      timestamp: Date.now() 
    }
  ]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentDirectory, setCurrentDirectory] = useState('/');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const consoleHeightRef = useRef<number>(250);

  // Register terminal keybindings
  useEffect(() => {
    // Set terminal scope
    keyBindingsService.setScope('terminal');
    
    // Register handlers
    const clearTerminalUnregister = keyBindingsService.registerHandler(
      'terminal.clear',
      handleClearTerminal
    );
    
    const runUnregister = keyBindingsService.registerHandler(
      'terminal.run',
      handleRunJS
    );
    
    // Cleanup
    return () => {
      clearTerminalUnregister();
      runUnregister();
    };
  }, []);

  // Scroll to bottom when history changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Set initial console height based on screen size
  useEffect(() => {
    const setInitialConsoleHeight = () => {
      const screenHeight = window.innerHeight;
      // On smaller screens, use a smaller console height
      if (screenHeight < 600) {
        consoleHeightRef.current = 180;
      } else if (screenHeight < 800) {
        consoleHeightRef.current = 220;
      } else {
        consoleHeightRef.current = 250;
      }
    };
    
    setInitialConsoleHeight();
    window.addEventListener('resize', setInitialConsoleHeight);
    
    return () => {
      window.removeEventListener('resize', setInitialConsoleHeight);
    };
  }, []);

  const findFile = (path: string) => {
    if (!currentProject) return null;
    
    // Make sure path starts with a slash
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    
    return currentProject.files.find(file => file.path === normalizedPath) || null;
  };

  const executeFile = async (fileId: string): Promise<string> => {
    if (!currentProject) return 'No project opened';
    
    const file = findFileById(fileId);
    if (!file || file.type !== 'file') return 'File not found';
    
    if (!file.content) return '';
    
    // Create a sandbox to execute the JavaScript
    try {
      // Capture console.log output and add to console messages
      const addConsoleMessage = (type: 'log' | 'error' | 'warn' | 'info', content: string) => {
        const message: ConsoleMessage = {
          id: Date.now().toString() + Math.random().toString(36).slice(2, 9),
          type,
          content,
          timestamp: Date.now()
        };
        setConsoleMessages(prev => [...prev, message]);
      };
      
      // Override console methods
      const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info
      };
      
      console.log = (...args) => {
        const formattedArgs = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        addConsoleMessage('log', formattedArgs);
        originalConsole.log(...args);
      };
      
      console.error = (...args) => {
        const formattedArgs = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        addConsoleMessage('error', formattedArgs);
        originalConsole.error(...args);
      };
      
      console.warn = (...args) => {
        const formattedArgs = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        addConsoleMessage('warn', formattedArgs);
        originalConsole.warn(...args);
      };
      
      console.info = (...args) => {
        const formattedArgs = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        addConsoleMessage('info', formattedArgs);
        originalConsole.info(...args);
      };
      
      // Execute the code in a safe way using Function constructor
      const sandboxedFn = new Function(file.content);
      
      // Show console automatically when executing a file
      setShowConsole(true);
      
      // Add a system message indicating execution
      addConsoleMessage('system', `Executing ${file.name}...`);
      
      try {
        sandboxedFn();
        addConsoleMessage('system', `Execution of ${file.name} completed`);
      } catch (error: any) {
        addConsoleMessage('error', `Runtime error: ${error.message}`);
        // Return the error to also show in terminal
        return `Error: ${error.message}`;
      } finally {
        // Restore console methods
        console.log = originalConsole.log;
        console.error = originalConsole.error;
        console.warn = originalConsole.warn;
        console.info = originalConsole.info;
      }
      
      return '';
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  };

  const generateSuggestions = (input: string) => {
    if (!input) return [];
    
    const baseCommands = [
      'help', 'clear', 'ls', 'pwd', 'cd', 'cat', 'touch', 
      'mkdir', 'rm', 'echo', 'run', 'node', 'npm', 'yarn', 
      'pnpm', 'npx', 'debug'
    ];
    
    const npmCommands = ['npm install', 'npm init', 'npm run', 'npm list', 'npm uninstall'];
    const nodeCommands = ['node -v', 'node --version', 'node -e'];
    const debugCommands = ['debug run', 'debug pause', 'debug step', 'debug stop'];
    
    // Add file suggestions for current directory
    const fileCommands: string[] = [];
    if (currentProject) {
      currentProject.files
        .filter(file => {
          const parentPath = file.path.substring(0, file.path.lastIndexOf('/'));
          return parentPath === currentDirectory || (currentDirectory === '/' && parentPath === '');
        })
        .forEach(file => {
          if (file.type === 'file' && file.name.endsWith('.js')) {
            fileCommands.push(`node ${file.name}`);
            fileCommands.push(`run ${file.name}`);
            fileCommands.push(`debug ${file.name}`);
          }
        });
    }
    
    const allCommands = [...baseCommands, ...npmCommands, ...nodeCommands, ...fileCommands, ...debugCommands];
    
    return allCommands
      .filter(cmd => cmd.startsWith(input))
      .slice(0, 5); // Limit to 5 suggestions
  };

  const handleCommandChange = (value: string) => {
    setCommand(value);
    
    // Generate suggestions
    const suggestions = generateSuggestions(value);
    setSuggestions(suggestions);
    setShowSuggestions(suggestions.length > 0);
  };

  const applySuggestion = (suggestion: string) => {
    setCommand(suggestion);
    setShowSuggestions(false);
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const executeCommand = async () => {
    if (!command.trim()) return;
    
    // Add command to history
    const commandLine: TerminalLine = {
      id: Date.now().toString(),
      content: command,
      isCommand: true,
    };
    
    setHistory(prev => [...prev, commandLine]);
    
    // Add to command history
    setCommandHistory(prev => [command, ...prev.slice(0, 49)]);
    setHistoryIndex(-1);
    
    // Hide suggestions
    setShowSuggestions(false);
    
    // Handle debug command separately
    if (command.startsWith('debug')) {
      handleDebugCommand(command.substring(5).trim());
      setCommand('');
      return;
    }
    
    const context = {
      currentProject,
      currentDirectory,
      findFile,
      executeFile,
      createFile: async (name: string, parentPath: string) => {
        // Find parent directory
        const parentDir = findFile(parentPath);
        if (!parentDir) throw new Error('Parent directory not found');
        
        await createNewFile(name, parentDir.id);
      },
      createDirectory: async (name: string, parentPath: string) => {
        // Find parent directory
        const parentDir = findFile(parentPath);
        if (!parentDir) throw new Error('Parent directory not found');
        
        await createNewFolder(name, parentDir.id);
      },
      deleteFile: async (path: string) => {
        const file = findFile(path);
        if (!file) throw new Error('File not found');
        
        await deleteFile(file.id);
      },
      saveFile: async (path: string, content: string) => {
        const file = findFile(path);
        if (!file) throw new Error('File not found');
        
        await saveFile(file.id, content);
      }
    };
    
    // Execute the command
    const result: CommandResult = await TerminalService.executeCommand(command, context);
    
    // Special case for clear command
    if (result.content === '$$CLEAR$$') {
      setHistory([]);
      setCommand('');
      return;
    }
    
    // Special case for cd command
    if (result.content && result.content.startsWith('$$CD$$')) {
      const newPath = result.content.substring(6);
      setCurrentDirectory(newPath);
      setCommand('');
      return;
    }
    
    // Add response to history
    const response: TerminalLine = {
      id: (Date.now() + 1).toString(),
      content: result.content,
      isCommand: false,
      isError: result.isError,
      isHtml: result.isHtml
    };
    
    setHistory(prev => [...prev, response]);
    setCommand('');
  };

  const handleDebugCommand = (args: string) => {
    const parts = args.trim().split(/\s+/);
    const command = parts[0];
    
    // If it's a file, try to debug it
    if (command && currentProject) {
      // First check if it matches a file name
      const file = currentProject.files.find(f => 
        f.type === 'file' && 
        f.name === command && 
        f.path.startsWith(currentDirectory)
      );
      
      if (file && file.type === 'file') {
        // This would require integration with a proper debugger
        addConsoleMessage('system', `Starting debug session for ${file.name}...`);
        setShowConsole(true);
        // Here you'd integrate with your actual debugger
        return;
      }
      
      // Handle debug sub-commands
      switch (command) {
        case 'run':
          if (currentFile && currentFile.language === 'javascript') {
            addConsoleMessage('system', `Starting debug session for ${currentFile.name}...`);
            setShowConsole(true);
          } else {
            addConsoleMessage('error', 'No JavaScript file is currently open for debugging');
          }
          break;
        case 'stop':
          addConsoleMessage('system', 'Debugging session stopped');
          break;
        case 'step':
          addConsoleMessage('system', 'Stepped to next line');
          break;
        case 'pause':
          addConsoleMessage('system', 'Execution paused');
          break;
        default:
          addConsoleMessage('error', `Unknown debug command: ${command}`);
          break;
      }
    } else {
      addConsoleMessage('error', 'Please specify a file to debug or a debug command');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle up arrow to navigate command history
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      }
    }
    
    // Handle down arrow to navigate command history
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
    
    // Handle tab for command completion
    if (e.key === 'Tab') {
      e.preventDefault();
      
      if (suggestions.length > 0) {
        applySuggestion(suggestions[0]);
      }
    }
    
    // Handle Enter key to execute command
    if (e.key === 'Enter') {
      executeCommand();
    }
  };

  const renderTerminalLine = (line: TerminalLine) => {
    if (line.isHtml) {
      return (
        <div 
          className={styles.terminalHtml}
          dangerouslySetInnerHTML={{ __html: line.content }}
        />
      );
    }
    
    return (
      <pre 
        className={styles.terminalLine}
        style={{ 
          color: line.isCommand 
            ? colors.primary 
            : line.isError 
              ? colors.error 
              : colors.text,
          fontFamily: 'Fira Code, monospace',
          fontWeight: line.isCommand ? 500 : 400,
        }}
      >
        {line.isCommand ? `${currentDirectory}> ` : ''}{line.content}
      </pre>
    );
  };

  const handleClearTerminal = () => {
    setHistory([]);
  };

  const handleClearConsole = () => {
    setConsoleMessages([{
      id: Date.now().toString(),
      type: 'system',
      content: 'Console cleared',
      timestamp: Date.now()
    }]);
  };

  const handleCopyToClipboard = () => {
    // Get all text from terminal
    const terminalText = history.map(line => {
      if (line.isCommand) {
        return `${currentDirectory}> ${line.content}`;
      }
      return line.content;
    }).join('\n');
    
    // Copy to clipboard
    navigator.clipboard.writeText(terminalText)
      .then(() => {
        // Show temporary success message
        setHistory(prev => [...prev, {
          id: Date.now().toString(),
          content: 'Terminal content copied to clipboard',
          isCommand: false
        }]);
      })
      .catch(err => {
        console.error('Failed to copy terminal content:', err);
      });
  };

  const handleRunJS = () => {
    // Find the currently open file or index.js in the current directory
    let fileToRun = currentFile;
    
    if (!fileToRun || !fileToRun.name.endsWith('.js')) {
      // Look for index.js or any JS file
      const indexFile = currentProject?.files.find(file => 
        file.type === 'file' && 
        file.name === 'index.js' && 
        (file.path === '/index.js' || file.path === `${currentDirectory}/index.js`)
      );
      
      if (indexFile) {
        fileToRun = {
          id: indexFile.id,
          name: indexFile.name,
          path: indexFile.path,
          language: 'javascript',
          content: indexFile.content || ''
        };
      } else {
        // Find any .js file
        const jsFile = currentProject?.files.find(file => 
          file.type === 'file' && 
          file.name.endsWith('.js') &&
          (file.path.startsWith(currentDirectory) || file.path.startsWith('/'))
        );
        
        if (jsFile) {
          fileToRun = {
            id: jsFile.id,
            name: jsFile.name,
            path: jsFile.path,
            language: 'javascript',
            content: jsFile.content || ''
          };
        }
      }
    }
    
    if (fileToRun) {
      addConsoleMessage('system', `Running ${fileToRun.name}...`);
      
      // Override console methods to capture output
      const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info
      };
      
      console.log = (...args) => {
        const formattedArgs = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        addConsoleMessage('log', formattedArgs);
        originalConsole.log(...args);
      };
      
      console.error = (...args) => {
        const formattedArgs = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        addConsoleMessage('error', formattedArgs);
        originalConsole.error(...args);
      };
      
      console.warn = (...args) => {
        const formattedArgs = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        addConsoleMessage('warn', formattedArgs);
        originalConsole.warn(...args);
      };
      
      console.info = (...args) => {
        const formattedArgs = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        addConsoleMessage('info', formattedArgs);
        originalConsole.info(...args);
      };
      
      try {
        // Execute the code in a safe way using Function constructor
        setShowConsole(true);
        const sandboxedFn = new Function(fileToRun.content);
        sandboxedFn();
        addConsoleMessage('system', `Execution of ${fileToRun.name} completed successfully`);
      } catch (error: any) {
        addConsoleMessage('error', `Runtime error: ${error.message}`);
        
        // Add the error to the terminal output as well
        setHistory(prev => [...prev, {
          id: Date.now().toString(),
          content: `Error executing ${fileToRun?.name}: ${error.message}`,
          isCommand: false,
          isError: true
        }]);
      } finally {
        // Restore console methods
        console.log = originalConsole.log;
        console.error = originalConsole.error;
        console.warn = originalConsole.warn;
        console.info = originalConsole.info;
      }
    } else {
      setHistory(prev => [...prev, {
        id: Date.now().toString(),
        content: 'No JavaScript files found to run. Create one with the "touch" command first.',
        isCommand: false,
        isError: true
      }]);
    }
  };

  const handleRunNpm = (npmCommand: string) => {
    setCommand(npmCommand);
    executeCommand();
  };

  const handleToggleDebug = () => {
    if (currentFile && currentFile.language === 'javascript') {
      addConsoleMessage('system', `Starting debug session for ${currentFile.name}...`);
      setShowConsole(true);
      // In a real implementation, this would connect to your debugger
    } else {
      addConsoleMessage('error', 'No JavaScript file is currently open for debugging');
      setShowConsole(true);
    }
  };

  const addConsoleMessage = (type: 'log' | 'error' | 'warn' | 'info' | 'system', content: string) => {
    const message: ConsoleMessage = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 9),
      type,
      content,
      timestamp: Date.now()
    };
    setConsoleMessages(prev => [...prev, message]);
  };

  if (!currentProject) {
    return (
      <EmptyState
        icon="Terminal"
        title="Terminal"
        message="Open a project first to use the terminal."
        actionText="Open Project"
        actionPath="/explorer"
      />
    );
  }

  return (
    <div 
      className={styles.container}
      style={{ backgroundColor: colors.background }}
    >
      <div 
        className={styles.headerBar}
        style={{ backgroundColor: colors.surface, borderBottomColor: colors.border }}
      >
        <div className={styles.headerTitle}>
          <TerminalIcon size={16} color={colors.primary} style={{ marginRight: 8 }} />
          <span 
            style={{ color: colors.text }}
          >
            Terminal: {currentProject?.name}
          </span>
        </div>
        
        <div className={styles.headerActions}>
          <button 
            className={styles.actionButton}
            title="Run JavaScript file (Alt+Shift+R)"
            onClick={handleRunJS}
          >
            <Play size={16} color={colors.textSecondary} />
          </button>
          <button 
            className={styles.actionButton}
            title="Debug JavaScript file"
            onClick={handleToggleDebug}
          >
            <Bug size={16} color={colors.textSecondary} />
          </button>
          <button 
            className={styles.actionButton}
            title="npm install"
            onClick={() => handleRunNpm("npm install")}
          >
            <PackageOpen size={16} color={colors.textSecondary} />
          </button>
          <button 
            className={styles.actionButton}
            title="Copy terminal content"
            onClick={handleCopyToClipboard}
          >
            <Clipboard size={16} color={colors.textSecondary} />
          </button>
          <button 
            className={styles.actionButton}
            title="Clear terminal (Ctrl+L)"
            onClick={handleClearTerminal}
          >
            <X size={16} color={colors.textSecondary} />
          </button>
          <button 
            className={`${styles.actionButton} ${showConsole ? styles.actionButtonActive : ''}`}
            title="Toggle console"
            onClick={() => setShowConsole(!showConsole)}
            style={{ 
              backgroundColor: showConsole ? `${colors.primary}20` : 'transparent',
              borderColor: showConsole ? colors.primary : 'transparent',
              borderWidth: '1px',
              borderStyle: 'solid'
            }}
          >
            <ChevronRight 
              size={16} 
              color={showConsole ? colors.primary : colors.textSecondary}
              style={{ transform: showConsole ? 'rotate(90deg)' : 'none' }}
            />
          </button>
        </div>
      </div>

      <div className={styles.contentContainer}>
        <div 
          ref={terminalRef}
          className={`${styles.terminalOutput} ${showConsole ? styles.terminalWithConsole : ''}`}
        >
          {history.map((line) => (
            <div 
              key={line.id} 
              className={styles.terminalLineContainer}
            >
              {renderTerminalLine(line)}
            </div>
          ))}
        </div>
        
        {showConsole && (
          <EnhancedConsoleOutput 
            messages={consoleMessages}
            onClear={handleClearConsole}
            height={consoleHeightRef.current}
            className={styles.consoleOutput}
          />
        )}
      </div>
      
      <div className={styles.suggestionsContainer} style={{ 
        display: showSuggestions ? 'block' : 'none',
        backgroundColor: colors.surface,
        borderColor: colors.border
      }}>
        {suggestions.map((suggestion, index) => (
          <div 
            key={index}
            className={styles.suggestionItem}
            style={{ 
              borderBottomColor: colors.border,
              color: colors.text
            }}
            onClick={() => applySuggestion(suggestion)}
          >
            {suggestion}
          </div>
        ))}
      </div>
      
      <div 
        className={styles.inputContainer}
        style={{ backgroundColor: colors.surface, borderTopColor: colors.border }}
      >
        <span 
          className={styles.prompt}
          style={{ color: colors.primary }}
        >
          {currentDirectory + '>'}
        </span>
        <input
          ref={inputRef}
          className={styles.input}
          style={{ color: colors.text }}
          value={command}
          onChange={(e) => handleCommandChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter command..."
          spellCheck="false"
        />
        <div className={styles.historyNavigation}>
          <button 
            className={styles.navButton}
            onClick={() => {
              if (commandHistory.length > 0) {
                const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
                setHistoryIndex(newIndex);
                setCommand(commandHistory[newIndex]);
              }
            }}
            disabled={commandHistory.length === 0 || historyIndex === commandHistory.length - 1}
            style={{ opacity: commandHistory.length === 0 || historyIndex === commandHistory.length - 1 ? 0.5 : 1 }}
          >
            <ArrowUp size={16} color={colors.textSecondary} />
          </button>
          <button 
            className={styles.navButton}
            onClick={() => {
              if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                setCommand(commandHistory[newIndex]);
              } else if (historyIndex === 0) {
                setHistoryIndex(-1);
                setCommand('');
              }
            }}
            disabled={historyIndex <= 0}
            style={{ opacity: historyIndex <= 0 ? 0.5 : 1 }}
          >
            <ArrowDown size={16} color={colors.textSecondary} />
          </button>
        </div>
        <button 
          className={styles.sendButton}
          style={{ 
            backgroundColor: command.trim() ? colors.primary : `${colors.primary}80`,
            opacity: command.trim() ? 1 : 0.7
          }}
          onClick={executeCommand}
          disabled={!command.trim()}
        >
          <ArrowUp size={16} color="#FFFFFF" style={{ transform: 'rotate(90deg)' }} />
        </button>
      </div>
    </div>
  );
};

export default TerminalScreen;