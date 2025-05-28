import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';
import Editor from 'react-simple-code-editor';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import python from 'highlight.js/lib/languages/python';
import markdown from 'highlight.js/lib/languages/markdown';
import json from 'highlight.js/lib/languages/json';
import { 
  Save, 
  Search, 
  X,
  AlignLeft,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import ExtendedKeyboard from './ExtendedKeyboard';
import FindReplaceBar from './FindReplaceBar';
import FormattingService from '../../services/FormattingService';
import LinterService, { LintIssue } from '../../services/LinterService';
import LintIssuesList from './LintIssuesList';
import keyBindingsService from '../../services/KeyBindingsService';
import AICodeSuggestion from './AICodeSuggestion';
import 'highlight.js/styles/github.css';
import 'highlight.js/styles/github-dark.css';

// Register languages
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('python', python);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('json', json);
hljs.registerLanguage('jsx', javascript);
hljs.registerLanguage('tsx', typescript);

interface CodeEditorProps {
  code: string;
  language: string;
  onChange: (text: string) => void;
  readOnly?: boolean;
}

interface HistoryItem {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

interface FindOptions {
  matchCase: boolean;
  wholeWord: boolean;
}

const MAX_HISTORY = 100;

const CodeEditor: React.FC<CodeEditorProps> = ({ code, language, onChange, readOnly = false }) => {
  const { colors, isDark } = useTheme();
  const { currentFile, updateFileContent, saveFile, hasUnsavedChanges } = useProject();
  const { editorSettings } = useSettings();
  const [value, setValue] = useState(code);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([{ value: code, selectionStart: 0, selectionEnd: 0 }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [currentFindMatches, setCurrentFindMatches] = useState<number[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const [lineCount, setLineCount] = useState(1);
  const [lintIssues, setLintIssues] = useState<LintIssue[]>([]);
  const [showProblems, setShowProblems] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(true);
  const [currentWordPrefix, setCurrentWordPrefix] = useState('');
  
  const editorRef = useRef<any>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Update internal state when code prop changes
  useEffect(() => {
    if (!isSaving && code !== value) {
      setValue(code);
      // Add to history when the code changes from outside
      addToHistory(code, selectionStart, selectionEnd);
      // Count lines for line numbers
      setLineCount(code.split('\n').length);
      // Run linter on new code
      runLinter(code);
    }
  }, [code]);

  // Register key bindings for the editor
  useEffect(() => {
    // Set editor scope
    keyBindingsService.setScope('editor');
    
    // Register handlers
    const saveUnregister = keyBindingsService.registerHandler('editor.save', handleSave);
    const formatUnregister = keyBindingsService.registerHandler('editor.format', handleFormat);
    const findUnregister = keyBindingsService.registerHandler('editor.find', () => {
      setShowFindReplace(true);
      setShowReplace(false);
    });
    const replaceUnregister = keyBindingsService.registerHandler('editor.replace', () => {
      setShowFindReplace(true);
      setShowReplace(true);
    });
    
    // Cleanup
    return () => {
      saveUnregister();
      formatUnregister();
      findUnregister();
      replaceUnregister();
    };
  }, []);

  // Run linter on code changes
  const runLinter = (content: string) => {
    if (!content || !language) return;
    
    const results = LinterService.lintCode(content, language);
    setLintIssues(results.issues);
  };

  const handleValueChange = (text: string) => {
    setValue(text);
    setIsSaving(true);
    
    // Update content in ProjectContext to track unsaved changes
    if (currentFile) {
      updateFileContent(currentFile.id, text);
    }
    
    // Call the parent onChange
    onChange(text);
    
    // Count lines for line numbers
    setLineCount(text.split('\n').length);
    
    // Get current selection
    let selStart = 0;
    let selEnd = 0;
    
    if (inputRef.current) {
      selStart = inputRef.current.selectionStart || 0;
      selEnd = inputRef.current.selectionEnd || 0;
      
      // Detect current word for AI suggestions
      const textBeforeCursor = text.substring(0, selStart);
      const currentWordMatch = textBeforeCursor.match(/[a-zA-Z0-9_]+$/);
      setCurrentWordPrefix(currentWordMatch ? currentWordMatch[0] : '');
    }
    
    // Add to history
    addToHistory(text, selStart, selEnd);
    
    // Run linter on the updated code
    runLinter(text);
    
    setIsSaving(false);
  };

  const addToHistory = (value: string, start: number, end: number) => {
    if (historyIndex < history.length - 1) {
      // If we're in the middle of the history, trim the future
      setHistory(prev => prev.slice(0, historyIndex + 1));
    }
    
    setHistory(prev => {
      const newHistory = [
        ...prev, 
        { value, selectionStart: start, selectionEnd: end }
      ];
      
      // Limit history size
      return newHistory.slice(-MAX_HISTORY);
    });
    
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const historyItem = history[newIndex];
      
      setValue(historyItem.value);
      setIsSaving(true);
      if (currentFile) {
        updateFileContent(currentFile.id, historyItem.value);
      }
      onChange(historyItem.value);
      setIsSaving(false);
      
      setHistoryIndex(newIndex);
      
      // Restore selection if possible
      if (inputRef.current) {
        inputRef.current.setSelectionRange(
          historyItem.selectionStart,
          historyItem.selectionEnd
        );
      }

      // Update line count
      setLineCount(historyItem.value.split('\n').length);
      
      // Run linter on the restored code
      runLinter(historyItem.value);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const historyItem = history[newIndex];
      
      setValue(historyItem.value);
      setIsSaving(true);
      if (currentFile) {
        updateFileContent(currentFile.id, historyItem.value);
      }
      onChange(historyItem.value);
      setIsSaving(false);
      
      setHistoryIndex(newIndex);
      
      // Restore selection if possible
      if (inputRef.current) {
        inputRef.current.setSelectionRange(
          historyItem.selectionStart,
          historyItem.selectionEnd
        );
      }

      // Update line count
      setLineCount(historyItem.value.split('\n').length);
      
      // Run linter on the restored code
      runLinter(historyItem.value);
    }
  };

  const handleSave = () => {
    if (currentFile) {
      saveFile(currentFile.id, value);
    }
  };
  
  // Format the current code
  const handleFormat = async () => {
    if (currentFile) {
      try {
        const formattedCode = await FormattingService(value, language);
        setValue(formattedCode);
        setIsSaving(true);
        if (currentFile) {
          updateFileContent(currentFile.id, formattedCode);
        }
        onChange(formattedCode);
        setIsSaving(false);
        
        // Update line count
        setLineCount(formattedCode.split('\n').length);
        
        // Add to history
        const selStart = 0;
        const selEnd = 0;
        addToHistory(formattedCode, selStart, selEnd);
        
        // Run linter on the formatted code
        runLinter(formattedCode);
      } catch (error) {
        console.error('Error formatting code:', error);
      }
    }
  };

  // Track selection changes
  const handleSelectionChange = (e: any) => {
    setSelectionStart(e.target.selectionStart);
    setSelectionEnd(e.target.selectionEnd);
    
    // Detect current word for AI suggestions
    if (e.target.selectionStart === e.target.selectionEnd) {
      const textBeforeCursor = value.substring(0, e.target.selectionStart);
      const currentWordMatch = textBeforeCursor.match(/[a-zA-Z0-9_]+$/);
      setCurrentWordPrefix(currentWordMatch ? currentWordMatch[0] : '');
    } else {
      setCurrentWordPrefix('');
    }
  };

  // Insert text at current cursor position
  const insertText = (text: string) => {
    const newValue = 
      value.substring(0, selectionStart) + 
      text + 
      value.substring(selectionEnd);
    
    const newCursorPosition = selectionStart + text.length;
    
    setValue(newValue);
    if (currentFile) {
      updateFileContent(currentFile.id, newValue);
    }
    onChange(newValue);
    
    // Update selection after insertion
    if (inputRef.current) {
      inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
    }
    
    // Add to history
    addToHistory(newValue, newCursorPosition, newCursorPosition);

    // Update line count
    setLineCount(newValue.split('\n').length);
    
    // Run linter on the updated code
    runLinter(newValue);
  };

  // Apply an AI suggestion
  const handleApplySuggestion = (completionText: string) => {
    if (!currentWordPrefix) {
      insertText(completionText);
      return;
    }
    
    // Replace the current word with the suggestion
    const prefixStart = selectionStart - currentWordPrefix.length;
    
    const newValue = 
      value.substring(0, prefixStart) + 
      completionText + 
      value.substring(selectionStart);
    
    const newCursorPosition = prefixStart + completionText.length;
    
    setValue(newValue);
    if (currentFile) {
      updateFileContent(currentFile.id, newValue);
    }
    onChange(newValue);
    
    // Update selection after insertion
    if (inputRef.current) {
      inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
    }
    
    // Add to history
    addToHistory(newValue, newCursorPosition, newCursorPosition);
    
    // Update line count and run linter
    setLineCount(newValue.split('\n').length);
    runLinter(newValue);
    
    // Reset the current word prefix
    setCurrentWordPrefix('');
  };

  // Map language to highlight.js language
  const getLanguage = (lang: string): string => {
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

  const highlightCode = (code: string) => {
    const lang = getLanguage(language);
    if (lang === 'plaintext') {
      return code;
    }
    
    try {
      return hljs.highlight(code, { language: lang }).value;
    } catch (error) {
      console.error('Syntax highlighting error:', error);
      return code;
    }
  };

  // Generate line numbers based on the content
  const renderLineNumbers = () => {
    const numbers = [];
    for (let i = 1; i <= lineCount; i++) {
      numbers.push(
        <span 
          key={i} 
          style={{
            display: 'block',
            color: colors.textSecondary,
            textAlign: 'right',
            paddingRight: '8px',
            fontSize: editorSettings.fontSize,
            lineHeight: `${editorSettings.fontSize * 1.5}px`,
            fontFamily: 'monospace',
            // Add a different background for lines with issues
            backgroundColor: lintIssues.some(issue => issue.line === i) 
              ? (isDark ? 'rgba(255, 0, 0, 0.05)' : 'rgba(255, 0, 0, 0.05)')
              : 'transparent'
          }}
          onClick={() => goToPosition(i, 1)}
        >
          {i}
        </span>
      );
    }
    return numbers;
  };

  // Jump to a specific line and column in the editor
  const goToPosition = (line: number, column: number) => {
    if (!inputRef.current) return;
    
    // Calculate position in the string based on line and column
    const lines = value.split('\n');
    let position = 0;
    
    for (let i = 0; i < line - 1 && i < lines.length; i++) {
      position += lines[i].length + 1; // +1 for the newline character
    }
    
    position += Math.min(column - 1, lines[line - 1]?.length || 0);
    
    // Set cursor position
    inputRef.current.focus();
    inputRef.current.setSelectionRange(position, position);
    
    // Ensure the position is visible (scroll into view)
    // This is a simple implementation - might not work perfectly in all cases
    const lineHeight = parseInt(getComputedStyle(inputRef.current).lineHeight);
    const scrollTop = (line - 1) * lineHeight - inputRef.current.clientHeight / 2;
    inputRef.current.scrollTop = Math.max(0, scrollTop);
  };

  // Find & Replace functionality
  const findText = (searchValue: string, options: FindOptions): number => {
    if (!searchValue) return 0;
    
    const text = value;
    const matches: number[] = [];
    
    // Create regex with appropriate flags
    let flags = 'g';
    if (!options.matchCase) flags += 'i';
    
    let searchRegex: RegExp;
    if (options.wholeWord) {
      searchRegex = new RegExp(`\\b${escapeRegExp(searchValue)}\\b`, flags);
    } else {
      searchRegex = new RegExp(escapeRegExp(searchValue), flags);
    }
    
    // Find all matches
    let match;
    while ((match = searchRegex.exec(text)) !== null) {
      matches.push(match.index);
    }
    
    setCurrentFindMatches(matches);
    
    // Select the first match if there are any
    if (matches.length > 0) {
      selectMatch(0);
    }
    
    return matches.length;
  };

  const findNext = () => {
    if (currentFindMatches.length === 0) return;
    
    const nextIndex = (currentMatchIndex + 1) % currentFindMatches.length;
    selectMatch(nextIndex);
  };

  const findPrevious = () => {
    if (currentFindMatches.length === 0) return;
    
    const prevIndex = (currentMatchIndex - 1 + currentFindMatches.length) % currentFindMatches.length;
    selectMatch(prevIndex);
  };

  const selectMatch = (index: number) => {
    if (!inputRef.current || currentFindMatches.length === 0) return;
    
    const matchPos = currentFindMatches[index];
    const searchText = value.substring(matchPos).match(/\S+/)?.[0] || '';
    
    inputRef.current.focus();
    inputRef.current.setSelectionRange(matchPos, matchPos + searchText.length);
    
    setSelectionStart(matchPos);
    setSelectionEnd(matchPos + searchText.length);
    setCurrentMatchIndex(index);
  };

  const replace = (replaceValue: string) => {
    if (currentFindMatches.length === 0 || !inputRef.current) return;
    
    const matchPos = currentFindMatches[currentMatchIndex];
    const searchText = value.substring(matchPos).match(/\S+/)?.[0] || '';
    
    // Replace the current match
    const newText = 
      value.substring(0, matchPos) + 
      replaceValue + 
      value.substring(matchPos + searchText.length);
    
    // Update the text
    setValue(newText);
    if (currentFile) {
      updateFileContent(currentFile.id, newText);
    }
    onChange(newText);

    // Update line count
    setLineCount(newText.split('\n').length);
    
    // Run linter on updated code
    runLinter(newText);
    
    // Update the match positions (they might have changed due to replacement)
    // For simplicity, we just re-run the search
    findText(searchText, { matchCase: false, wholeWord: false });
  };

  const replaceAll = (findValue: string, replaceValue: string, options: FindOptions): number => {
    if (!findValue) return 0;
    
    // Create regex with appropriate flags
    let flags = 'g';
    if (!options.matchCase) flags += 'i';
    
    let searchRegex: RegExp;
    if (options.wholeWord) {
      searchRegex = new RegExp(`\\b${escapeRegExp(findValue)}\\b`, flags);
    } else {
      searchRegex = new RegExp(escapeRegExp(findValue), flags);
    }
    
    // Replace all occurrences
    const newText = value.replace(searchRegex, replaceValue);
    const count = (value.match(searchRegex) || []).length;
    
    // Update the text
    setValue(newText);
    if (currentFile) {
      updateFileContent(currentFile.id, newText);
    }
    onChange(newText);

    // Update line count
    setLineCount(newText.split('\n').length);
    
    // Run linter on updated code
    runLinter(newText);
    
    // Clear matches
    setCurrentFindMatches([]);
    setCurrentMatchIndex(-1);
    
    return count;
  };

  // Helper function to escape special regex characters
  const escapeRegExp = (string: string): string => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Calculate AI suggestion position
  const getAISuggestionPosition = () => {
    if (!inputRef.current || !currentWordPrefix) {
      return { top: 0, left: 0 };
    }

    const editorRect = inputRef.current.getBoundingClientRect();
    const { selectionStart } = inputRef.current;
    
    // Get the current line and column
    const textBeforeCursor = value.substring(0, selectionStart);
    const lines = textBeforeCursor.split('\n');
    const currentLine = lines.length;
    const currentColumn = lines[lines.length - 1].length;
    
    // Approximate position calculation (can be improved)
    const lineHeight = editorSettings.fontSize * 1.5;
    const charWidth = editorSettings.fontSize * 0.6;
    
    const top = (currentLine * lineHeight) + editorSettings.fontSize;
    const left = (currentColumn * charWidth) + 20; // +20 for line numbers column
    
    return { top, left };
  };

  return (
    <div 
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: colors.codeBackground,
        position: 'relative'
      }}
    >
      {showFindReplace && (
        <FindReplaceBar
          value={value}
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
      
      <div style={{
        position: 'absolute',
        top: '8px',
        right: '8px',
        zIndex: 5,
        display: 'flex',
        flexDirection: 'row',
        gap: '4px',
      }}>
        <button
          style={{
            padding: '8px',
            borderRadius: '4px',
            marginLeft: '4px',
            backgroundColor: colors.surface,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => {
            setShowFindReplace(true);
            setShowReplace(false);
          }}
          title="Find (Ctrl+F)"
        >
          <Search size={20} color={colors.textSecondary} />
        </button>
        
        <button
          style={{
            padding: '8px',
            borderRadius: '4px',
            marginLeft: '4px',
            backgroundColor: colors.surface,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={handleFormat}
          title="Format Document (Alt+Shift+F)"
        >
          <AlignLeft size={20} color={colors.textSecondary} />
        </button>
        
        <button
          style={{
            padding: '8px',
            borderRadius: '4px',
            marginLeft: '4px',
            backgroundColor: colors.surface,
            border: showProblems ? `1px solid ${colors.warning}` : 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}
          onClick={() => setShowProblems(!showProblems)}
          title={showProblems ? "Hide Problems" : "Show Problems"}
        >
          <AlertTriangle size={20} color={colors.warning} />
          {lintIssues.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                backgroundColor: colors.warning,
                color: 'white',
                borderRadius: '50%',
                width: '16px',
                height: '16px',
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {lintIssues.length}
            </div>
          )}
        </button>
        
        <button
          style={{
            padding: '8px',
            borderRadius: '4px',
            marginLeft: '4px',
            backgroundColor: colors.surface,
            border: showAISuggestions ? `1px solid ${colors.primary}` : 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setShowAISuggestions(!showAISuggestions)}
          title={showAISuggestions ? "Disable AI Suggestions" : "Enable AI Suggestions"}
        >
          <Zap 
            size={20} 
            color={showAISuggestions ? colors.primary : colors.textSecondary} 
          />
        </button>
        
        <button
          style={{
            padding: '8px',
            borderRadius: '4px',
            marginLeft: '4px',
            backgroundColor: colors.surface,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={handleSave}
          title="Save (Ctrl+S)"
        >
          <Save 
            size={20} 
            color={currentFile && hasUnsavedChanges(currentFile.id) ? colors.primary : colors.textSecondary} 
          />
        </button>
      </div>
      
      {/* Lint issues panel */}
      {showProblems && lintIssues.length > 0 && (
        <div style={{
          borderBottom: `1px solid ${colors.border}`,
          maxHeight: '150px',
          overflow: 'auto',
          backgroundColor: colors.surface,
          marginBottom: '10px'
        }}>
          <LintIssuesList 
            issues={lintIssues} 
            onIssueClick={(issue) => goToPosition(issue.line, issue.column)}
          />
        </div>
      )}
      
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'row' 
      }}>
        <div style={{
          paddingTop: '16px',
          paddingRight: '8px',
          paddingLeft: '8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
        }}>
          {renderLineNumbers()}
        </div>
        
        <div style={{ 
          flex: 1,
          overflowY: 'auto',
          position: 'relative'
        }}>
          <div ref={editorRef}>
            <textarea
              ref={inputRef}
              style={{
                fontFamily: 'monospace',
                fontSize: editorSettings.fontSize,
                lineHeight: `${editorSettings.fontSize * 1.5}px`,
                color: colors.text,
                backgroundColor: colors.codeBackground,
                padding: '16px',
                paddingLeft: '0',
                minHeight: '300px',
                width: '100%',
                border: 'none',
                outline: 'none',
                resize: 'none',
              }}
              value={value}
              onChange={(e) => handleValueChange(e.target.value)}
              onSelect={handleSelectionChange}
              spellCheck={false}
              readOnly={readOnly}
            />
            
            {/* AI Suggestions */}
            {showAISuggestions && !readOnly && (
              <AICodeSuggestion
                code={value}
                language={language}
                position={selectionStart}
                prefix={currentWordPrefix}
                onSelect={handleApplySuggestion}
                visible={!!currentWordPrefix && currentWordPrefix.length > 1}
              />
            )}
          </div>
        </div>
      </div>
      
      {!readOnly && (
        <ExtendedKeyboard
          onKeyPress={insertText}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onSave={handleSave}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          tabSize={editorSettings.tabSize}
          useTabs={editorSettings.useTabs}
        />
      )}
    </div>
  );
};

export default CodeEditor;