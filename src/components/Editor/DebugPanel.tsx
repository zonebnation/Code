import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import debuggerService, { DebuggerState, ConsoleMessage } from '../../services/DebuggerService';
import { Play, Pause, SkipForward, CornerRightDown, CornerLeftDown, StopCircle, Trash, AlertCircle, TerminalSquare } from 'lucide-react';
import styles from './DebugPanel.module.css';

interface DebugPanelProps {
  code: string;
  onLineHighlight?: (line: number | null) => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ code, onLineHighlight }) => {
  const { colors } = useTheme();
  const [state, setState] = useState<DebuggerState>(debuggerService.getState());
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>(debuggerService.getConsoleMessages());
  const [activeTab, setActiveTab] = useState<'console' | 'variables'>('console');

  useEffect(() => {
    debuggerService.initialize(code);
    
    const handleStateChange = (newState: DebuggerState) => {
      setState(newState);
      if (onLineHighlight) {
        onLineHighlight(newState.currentLine);
      }
    };
    
    const handleConsoleMessage = (message: ConsoleMessage) => {
      setConsoleMessages(prev => [...prev, message]);
    };
    
    const handleConsoleCleared = () => {
      setConsoleMessages([]);
    };
    
    // Subscribe to debugger events
    debuggerService.on('stateChanged', handleStateChange);
    debuggerService.on('consoleMessage', handleConsoleMessage);
    debuggerService.on('consoleCleared', handleConsoleCleared);
    
    return () => {
      // Unsubscribe from events
      debuggerService.off('stateChanged', handleStateChange);
      debuggerService.off('consoleMessage', handleConsoleMessage);
      debuggerService.off('consoleCleared', handleConsoleCleared);
    };
  }, [code, onLineHighlight]);
  
  // Re-initialize debugger when code changes
  useEffect(() => {
    debuggerService.initialize(code);
  }, [code]);
  
  const formatValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    
    try {
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      return String(value);
    } catch (e) {
      return '<error displaying value>';
    }
  };
  
  const getMessageStyle = (type: string) => {
    switch (type) {
      case 'error':
        return { color: colors.error };
      case 'warn':
        return { color: colors.warning };
      case 'info':
        return { color: colors.primary };
      default:
        return { color: colors.text };
    }
  };
  
  // Event handlers
  const handleStart = () => debuggerService.start();
  const handlePause = () => debuggerService.pause();
  const handleResume = () => debuggerService.resume();
  const handleStop = () => debuggerService.stop();
  const handleStepOver = () => debuggerService.stepOver();
  const handleStepInto = () => debuggerService.stepInto();
  const handleStepOut = () => debuggerService.stepOut();
  const handleClearConsole = () => debuggerService.clearConsole();
  
  return (
    <div 
      className={styles.container}
      style={{ backgroundColor: colors.surface, borderTopColor: colors.border }}
    >
      <div className={styles.toolbar}>
        <div className={styles.controls}>
          {!state.isRunning ? (
            <button 
              className={styles.button} 
              onClick={handleStart}
              title="Start debugging"
            >
              <Play size={16} color={colors.success} />
            </button>
          ) : (
            state.isPaused ? (
              <button 
                className={styles.button} 
                onClick={handleResume}
                title="Resume"
              >
                <Play size={16} color={colors.success} />
              </button>
            ) : (
              <button 
                className={styles.button} 
                onClick={handlePause}
                title="Pause"
              >
                <Pause size={16} color={colors.warning} />
              </button>
            )
          )}
          
          <button 
            className={styles.button}
            onClick={handleStop}
            disabled={!state.isRunning}
            title="Stop debugging"
            style={{ opacity: state.isRunning ? 1 : 0.5 }}
          >
            <StopCircle size={16} color={colors.error} />
          </button>
          
          <span className={styles.divider} style={{ backgroundColor: colors.border }}></span>
          
          <button 
            className={styles.button}
            onClick={handleStepOver}
            disabled={!state.isRunning || !state.isPaused}
            title="Step over"
            style={{ opacity: state.isRunning && state.isPaused ? 1 : 0.5 }}
          >
            <SkipForward size={16} color={colors.text} />
          </button>
          
          <button 
            className={styles.button}
            onClick={handleStepInto}
            disabled={!state.isRunning || !state.isPaused}
            title="Step into"
            style={{ opacity: state.isRunning && state.isPaused ? 1 : 0.5 }}
          >
            <CornerRightDown size={16} color={colors.text} />
          </button>
          
          <button 
            className={styles.button}
            onClick={handleStepOut}
            disabled={!state.isRunning || !state.isPaused}
            title="Step out"
            style={{ opacity: state.isRunning && state.isPaused ? 1 : 0.5 }}
          >
            <CornerLeftDown size={16} color={colors.text} />
          </button>
        </div>
        
        <div className={styles.status}>
          {state.isRunning ? (
            state.isPaused ? (
              <span style={{ color: colors.warning }}>Paused at line {state.currentLine}</span>
            ) : (
              <span style={{ color: colors.success }}>Running...</span>
            )
          ) : state.error ? (
            <span style={{ color: colors.error }}>Error: {state.error}</span>
          ) : (
            <span style={{ color: colors.textSecondary }}>Ready</span>
          )}
        </div>
        
        <div className={styles.actions}>
          {activeTab === 'console' && (
            <button 
              className={styles.button}
              onClick={handleClearConsole}
              title="Clear console"
            >
              <Trash size={16} color={colors.textSecondary} />
            </button>
          )}
        </div>
      </div>
      
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'console' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('console')}
          style={{ 
            borderBottomColor: activeTab === 'console' ? colors.primary : 'transparent',
            color: activeTab === 'console' ? colors.primary : colors.textSecondary
          }}
        >
          <TerminalSquare size={14} />
          <span>Console</span>
        </button>
        
        <button 
          className={`${styles.tab} ${activeTab === 'variables' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('variables')}
          style={{ 
            borderBottomColor: activeTab === 'variables' ? colors.primary : 'transparent',
            color: activeTab === 'variables' ? colors.primary : colors.textSecondary
          }}
        >
          <AlertCircle size={14} />
          <span>Variables</span>
        </button>
      </div>
      
      <div className={styles.content}>
        {activeTab === 'console' && (
          <div className={styles.console}>
            {consoleMessages.length === 0 ? (
              <div className={styles.emptyState} style={{ color: colors.textSecondary }}>
                Console output will appear here
              </div>
            ) : (
              consoleMessages.map(message => (
                <div key={message.id} className={styles.message}>
                  <pre 
                    className={styles.messageContent}
                    style={getMessageStyle(message.type)}
                  >
                    {message.content}
                  </pre>
                </div>
              ))
            )}
          </div>
        )}
        
        {activeTab === 'variables' && (
          <div className={styles.variables}>
            {state.variables.length === 0 ? (
              <div className={styles.emptyState} style={{ color: colors.textSecondary }}>
                {state.isRunning && state.isPaused 
                  ? 'No variables in the current scope' 
                  : 'Variables will be shown when execution is paused'}
              </div>
            ) : (
              <table className={styles.variablesTable}>
                <thead>
                  <tr>
                    <th style={{ color: colors.textSecondary }}>Name</th>
                    <th style={{ color: colors.textSecondary }}>Type</th>
                    <th style={{ color: colors.textSecondary }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {state.variables.map((variable, index) => (
                    <tr key={index} className={styles.variableRow}>
                      <td style={{ color: colors.primary }}>{variable.name}</td>
                      <td style={{ color: colors.textSecondary }}>{variable.type}</td>
                      <td style={{ color: colors.text }}>{formatValue(variable.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugPanel;