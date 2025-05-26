import React, { useRef, useEffect, useState } from 'react';
import * as monaco from 'monaco-editor';
import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';
import { Save, Search, Bug, Play, Pause } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import FindReplaceBar, { FindOptions } from './FindReplaceBar';
import DebugPanel from './DebugPanel';
import CollaborativeCursors from './CollaborativeCursors';
import CollaborationService from '../../services/CollaborationService';
import debuggerService, { BreakpointLocation } from '../../services/DebuggerService';
import { CursorData } from '../../types/collaboration';
import styles from './MonacoEditor.module.css';

// Define interface for Monaco Editor component props
interface MonacoEditorProps {
  code: string;
  language: string;
  onChange: (text: string) => void;
  isCollaborative?: boolean;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({ 
  code, 
  language, 
  onChange,
  isCollaborative = false
}) => {
  const { colors, isDark } = useTheme();
  const { currentFile, updateFileContent, saveFile, hasUnsavedChanges, currentProject } = useProject();
  const { user, profile } = useAuth();
  const { editorSettings } = useSettings();
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [matchesCount, setMatchesCount] = useState(0);
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [showDebugger, setShowDebugger] = useState(false);
  const [breakpoints, setBreakpoints] = useState<BreakpointLocation[]>([]);
  const [isDebugging, setIsDebugging] = useState(false);
  const [remoteCursors, setRemoteCursors] = useState<CursorData[]>([]);
  
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const cursorUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Monaco Editor
  useEffect(() => {
    // Prevent re-initialization
    if (editorContainerRef.current && !editor) {
      // Configure theme
      monaco.editor.defineTheme('code-canvas-light', {
        base: 'vs',
        inherit: true,
        rules: [
          { token: 'comment', foreground: colors.codeSyntax.comment },
          { token: 'keyword', foreground: colors.codeSyntax.keyword },
          { token: 'string', foreground: colors.codeSyntax.string },
          { token: 'number', foreground: colors.codeSyntax.number },
          { token: 'function', foreground: colors.codeSyntax.function },
          { token: 'variable', foreground: colors.codeSyntax.variable },
        ],
        colors: {
          'editor.foreground': colors.text,
          'editor.background': colors.codeBackground,
          'editorLineNumber.foreground': colors.textSecondary,
          'editorCursor.foreground': colors.text,
          'editor.selectionBackground': '#ADD6FF80',
          'editor.inactiveSelectionBackground': '#E5EBF1'
        }
      });

      monaco.editor.defineTheme('code-canvas-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: colors.codeSyntax.comment },
          { token: 'keyword', foreground: colors.codeSyntax.keyword },
          { token: 'string', foreground: colors.codeSyntax.string },
          { token: 'number', foreground: colors.codeSyntax.number },
          { token: 'function', foreground: colors.codeSyntax.function },
          { token: 'variable', foreground: colors.codeSyntax.variable },
        ],
        colors: {
          'editor.foreground': colors.text,
          'editor.background': colors.codeBackground,
          'editorLineNumber.foreground': colors.textSecondary,
          'editorCursor.foreground': colors.text,
          'editor.selectionBackground': '#264F7880',
          'editor.inactiveSelectionBackground': '#3A3D41'
        }
      });

      const newEditor = monaco.editor.create(editorContainerRef.current, {
        value: code,
        language: mapLanguage(language),
        theme: isDark ? 'code-canvas-dark' : 'code-canvas-light',
        automaticLayout: true,
        minimap: {
          enabled: false // Disable minimap for better mobile performance
        },
        fontSize: editorSettings.fontSize,
        tabSize: editorSettings.tabSize,
        wordWrap: editorSettings.wordWrap ? 'on' : 'off',
        scrollBeyondLastLine: false,
        lineNumbers: 'on',
        glyphMargin: true, // Enable glyph margin for breakpoints
        folding: false, // Disable code folding for better performance
        renderWhitespace: 'none',
        padding: { top: 8, bottom: 8 },
        scrollbar: {
          vertical: 'visible',
          horizontal: 'visible',
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10
        }
      });

      setEditor(newEditor);
      
      // Add event listeners for content changes
      newEditor.onDidChangeModelContent(() => {
        const newValue = newEditor.getValue();
        onChange(newValue);
        
        // Update content in ProjectContext to track unsaved changes
        if (currentFile) {
          updateFileContent(currentFile.id, newValue);
        }
      });
      
      // Add keyboard shortcuts
      newEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        if (currentFile) {
          saveFile(currentFile.id, newEditor.getValue());
        }
      });
      
      newEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
        setShowFindReplace(true);
        setShowReplace(false);
      });
      
      newEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KeyF, () => {
        setShowFindReplace(true);
        setShowReplace(true);
      });

      // Add breakpoint handling
      newEditor.onMouseDown((e) => {
        if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
          const lineNumber = e.target.position?.lineNumber;
          if (lineNumber) {
            toggleBreakpoint(lineNumber);
          }
        }
      });
      
      // Add cursor position change listener for collaborative editing
      if (isCollaborative && user && currentProject && currentFile) {
        newEditor.onDidChangeCursorPosition((e) => {
          // Debounce cursor updates to avoid flooding the server
          if (cursorUpdateTimeoutRef.current) {
            clearTimeout(cursorUpdateTimeoutRef.current);
          }
          
          cursorUpdateTimeoutRef.current = setTimeout(() => {
            const position = newEditor.getPosition();
            const selection = newEditor.getSelection();
            
            if (position) {
              CollaborationService.updateCursor(
                currentProject.id,
                currentFile.id,
                user.id,
                { line: position.lineNumber, column: position.column },
                selection ? {
                  startLine: selection.startLineNumber,
                  startColumn: selection.startColumn,
                  endLine: selection.endLineNumber,
                  endColumn: selection.endColumn
                } : undefined
              );
            }
          }, 100); // 100ms debounce
        });
      }
    }

    // Cleanup
    return () => {
      if (editor) {
        editor.dispose();
      }
      
      if (cursorUpdateTimeoutRef.current) {
        clearTimeout(cursorUpdateTimeoutRef.current);
      }
    };
  }, [colors, isDark, editorSettings.fontSize]);

  // Update editor content when code prop changes
  useEffect(() => {
    if (editor && code !== editor.getValue()) {
      editor.setValue(code);
    }
  }, [code, editor]);

  // Update editor options when settings change
  useEffect(() => {
    if (editor) {
      editor.updateOptions({
        fontSize: editorSettings.fontSize,
        tabSize: editorSettings.tabSize,
        wordWrap: editorSettings.wordWrap ? 'on' : 'off',
        theme: isDark ? 'code-canvas-dark' : 'code-canvas-light'
      });
    }
  }, [editorSettings, isDark, editor]);
  
  // Update editor language when language prop changes
  useEffect(() => {
    if (editor) {
      const currentModel = editor.getModel();
      if (currentModel) {
        monaco.editor.setModelLanguage(currentModel, mapLanguage(language));
      }
    }
  }, [language, editor]);

  // Listen for breakpoint changes
  useEffect(() => {
    const handleBreakpointsChanged = (newBreakpoints: BreakpointLocation[]) => {
      setBreakpoints(newBreakpoints);
      updateBreakpointDecorations(newBreakpoints);
    };
    
    // Subscribe to debugger events
    debuggerService.on('breakpointsChanged', handleBreakpointsChanged);
    
    // Update breakpoint decorations on editor initialization
    if (editor) {
      updateBreakpointDecorations(debuggerService.getBreakpoints());
    }
    
    return () => {
      // Unsubscribe from events
      debuggerService.off('breakpointsChanged', handleBreakpointsChanged);
    };
  }, [editor]);

  // Listen for debugger state changes
  useEffect(() => {
    const handleStateChanged = (state: any) => {
      setIsDebugging(state.isRunning);
      
      // Handle highlighting the current line
      if (state.currentLine && editor) {
        highlightLine(state.currentLine);
      } else if (editor) {
        // Clear highlight if not debugging
        editor.deltaDecorations(
          editor.getModel()?.getAllDecorations()
            .filter(d => d.options.className === 'currentLineHighlight')
            .map(d => d.id) || [], 
          []
        );
      }
    };
    
    debuggerService.on('stateChanged', handleStateChanged);
    
    return () => {
      debuggerService.off('stateChanged', handleStateChanged);
    };
  }, [editor]);
  
  // Set up collaborative editing
  useEffect(() => {
    if (isCollaborative && editor && user && profile && currentProject && currentFile) {
      // Join collaborative editing for this file
      CollaborationService.joinFile(
        currentProject.id,
        currentFile.id,
        user.id,
        profile.username || user.email?.split('@')[0] || 'Anonymous',
        profile.avatar_url,
        editor,
        handleRemoteContentChange,
        handleRemoteCursorsChange
      );
      
      return () => {
        if (currentProject && currentFile) {
          CollaborationService.leaveFile(currentProject.id, currentFile.id);
        }
      };
    }
  }, [isCollaborative, editor, user, profile, currentProject, currentFile]);

  // Handle remote content changes
  const handleRemoteContentChange = (fileId: string, content: string, remoteUser: any) => {
    // This is handled by YJS binding now
    console.log(`Received content change from ${remoteUser.username}`);
  };
  
  // Handle remote cursor changes
  const handleRemoteCursorsChange = (cursors: CursorData[]) => {
    setRemoteCursors(cursors);
  };

  // Update breakpoint decorations in editor
  const updateBreakpointDecorations = (breakpoints: BreakpointLocation[]) => {
    if (!editor) return;
    
    const model = editor.getModel();
    if (!model) return;
    
    const breakpointDecorations = breakpoints.map(bp => ({
      range: {
        startLineNumber: bp.lineNumber,
        endLineNumber: bp.lineNumber,
        startColumn: 1,
        endColumn: 1
      },
      options: {
        isWholeLine: false,
        glyphMarginClassName: 'breakpointGutter',
        glyphMarginHoverMessage: { value: `Breakpoint at line ${bp.lineNumber}` }
      }
    }));
    
    editor.createDecorationsCollection(breakpointDecorations);
  };

  // Toggle a breakpoint at the specified line
  const toggleBreakpoint = (lineNumber: number) => {
    debuggerService.toggleBreakpoint(lineNumber);
  };

  // Highlight the current execution line
  const highlightLine = (lineNumber: number) => {
    if (!editor) return;
    
    const model = editor.getModel();
    if (!model) return;
    
    editor.deltaDecorations(
      editor.getModel()?.getAllDecorations()
        .filter(d => d.options.className === 'currentLineHighlight')
        .map(d => d.id) || [], 
      [
        {
          range: {
            startLineNumber: lineNumber,
            endLineNumber: lineNumber,
            startColumn: 1,
            endColumn: model.getLineContent(lineNumber).length + 1
          },
          options: {
            isWholeLine: true,
            className: 'currentLineHighlight',
            inlineClassName: 'currentLineInline',
          }
        }
      ]
    );
    
    // Scroll the editor to show the current line
    editor.revealLineInCenter(lineNumber);
  };
  
  // Find & Replace functionality
  const findText = (searchValue: string, options: FindOptions): number => {
    if (!editor || !searchValue) return 0;
    
    // Clear previous findings
    editor.getAction('clearEditorFindState')?.run();
    
    // Find all matches
    const matches = editor.getModel()?.findMatches(
      searchValue,
      true, // Search in selection
      !options.wholeWord, // Allow partial matches if not whole word
      options.matchCase, // Match case
      options.wholeWord ? 'whole' : 'none', // Word option
      false, // Exclude overlapping matches
      9999 // Limit (high number)
    ) || [];
    
    // Select the first match
    if (matches.length > 0) {
      editor.setSelection(matches[0].range);
      editor.revealRangeInCenter(matches[0].range);
    }
    
    setMatchesCount(matches.length);
    return matches.length;
  };
  
  const findNext = () => {
    editor?.getAction('editor.action.nextMatchFindAction')?.run();
  };
  
  const findPrevious = () => {
    editor?.getAction('editor.action.previousMatchFindAction')?.run();
  };
  
  const replace = (replaceValue: string) => {
    if (!editor) return;
    
    const selection = editor.getSelection();
    if (selection && !selection.isEmpty()) {
      editor.executeEdits('', [{ range: selection, text: replaceValue, forceMoveMarkers: true }]);
    }
  };
  
  const replaceAll = (findValue: string, replaceValue: string, options: FindOptions): number => {
    if (!editor || !findValue) return 0;
    
    const model = editor.getModel();
    if (!model) return 0;
    
    // Find all matches
    const matches = model.findMatches(
      findValue,
      true, // Search in selection
      !options.wholeWord, // Allow partial matches if not whole word
      options.matchCase, // Match case
      options.wholeWord ? 'whole' : 'none', // Word option
      false, // Exclude overlapping matches
      9999 // Limit (high number)
    );
    
    // Replace all matches (start from the end to avoid position shifts)
    const count = matches.length;
    if (count > 0) {
      editor.pushUndoStop();
      const edits = matches
        .sort((a, b) => b.range.startLineNumber - a.range.startLineNumber || b.range.startColumn - a.range.startColumn)
        .map(match => ({
          range: match.range,
          text: replaceValue,
          forceMoveMarkers: true
        }));
      
      editor.executeEdits('', edits);
      editor.pushUndoStop();
    }
    
    return count;
  };
  
  // Helper to map language IDs from our app to Monaco's language IDs
  const mapLanguage = (lang: string): string => {
    const langMap: Record<string, string> = {
      'javascript': 'javascript',
      'jsx': 'javascript',
      'typescript': 'typescript',
      'tsx': 'typescript',
      'html': 'html',
      'css': 'css',
      'python': 'python',
      'markdown': 'markdown',
      'json': 'json',
      'plaintext': 'plaintext'
    };
    
    return langMap[lang] || 'plaintext';
  };
  
  const handleSave = () => {
    if (currentFile && editor) {
      saveFile(currentFile.id, editor.getValue());
    }
  };

  const handleToggleDebugger = () => {
    setShowDebugger(!showDebugger);
    
    // If closing the debugger, stop any active debugging session
    if (showDebugger) {
      debuggerService.stop();
    }
  };

  const handleHighlightLine = (lineNumber: number | null) => {
    if (lineNumber) {
      highlightLine(lineNumber);
    }
  };

  return (
    <div className={styles.container} style={{ backgroundColor: colors.codeBackground }}>
      <style>{`
        .breakpointGutter {
          background-color: ${colors.error};
          border-radius: 50%;
          margin-left: 5px;
          width: 8px !important;
          height: 8px !important;
          display: inline-block;
        }
        
        .currentLineHighlight {
          background-color: ${colors.selectedItem};
          border-left: 2px solid ${colors.primary};
        }
        
        .currentLineInline {
          font-weight: bold;
        }
      `}</style>
      
      {showFindReplace && (
        <FindReplaceBar
          value={editor?.getValue() || ''}
          onFind={findText}
          onFindNext={findNext}
          onFindPrevious={findPrevious}
          onReplace={replace}
          onReplaceAll={replaceAll}
          onClose={() => setShowFindReplace(false)}
          showReplace={showReplace}
          toggleShowReplace={() => setShowReplace(!showReplace)}
        />
      )}
      
      <div className={styles.toolbar}>
        <button
          className={styles.toolbarButton}
          style={{ backgroundColor: colors.surface }}
          onClick={() => setShowFindReplace(true)}
          title="Find (Ctrl+F)"
        >
          <Search size={16} color={colors.textSecondary} />
        </button>
        
        <button
          className={styles.toolbarButton}
          style={{ backgroundColor: colors.surface }}
          onClick={handleSave}
          title="Save (Ctrl+S)"
        >
          <Save 
            size={16} 
            color={currentFile && hasUnsavedChanges(currentFile.id) ? colors.primary : colors.textSecondary} 
          />
        </button>
        
        <button
          className={styles.toolbarButton}
          style={{ 
            backgroundColor: colors.surface,
            borderColor: showDebugger ? colors.primary : 'transparent',
            borderWidth: showDebugger ? '1px' : '0',
            borderStyle: 'solid'
          }}
          onClick={handleToggleDebugger}
          title="Toggle debugger"
        >
          <Bug 
            size={16} 
            color={showDebugger ? colors.primary : colors.textSecondary} 
          />
        </button>
        
        {showDebugger && !isDebugging && (
          <button
            className={styles.toolbarButton}
            style={{ backgroundColor: colors.surface }}
            onClick={() => debuggerService.start()}
            title="Run code with debugger"
          >
            <Play 
              size={16} 
              color={colors.success} 
            />
          </button>
        )}
        
        {showDebugger && isDebugging && (
          <button
            className={styles.toolbarButton}
            style={{ backgroundColor: colors.surface }}
            onClick={() => debuggerService.stop()}
            title="Stop debugging"
          >
            <Pause 
              size={16} 
              color={colors.warning} 
            />
          </button>
        )}
      </div>
      
      <div 
        ref={editorContainerRef} 
        className={styles.editorContainer}
      />
      
      {/* Collaborative cursors */}
      {isCollaborative && editor && (
        <CollaborativeCursors 
          cursors={remoteCursors}
          editor={editor}
        />
      )}
      
      {showDebugger && (
        <DebugPanel 
          code={code}
          onLineHighlight={handleHighlightLine}
        />
      )}
    </div>
  );
};

export default MonacoEditor;