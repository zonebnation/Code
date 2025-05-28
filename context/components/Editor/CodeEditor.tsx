import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TextInput, Platform, KeyboardAvoidingView, Text } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useSettings } from '@/context/SettingsContext';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'highlight.js/lib/core';
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
  X 
} from 'lucide-react-native';
import { useProject } from '@/context/ProjectContext';
import ExtendedKeyboard from './ExtendedKeyboard';
import FindReplaceBar from './FindReplaceBar';
import 'highlight.js/styles/github.css';
import 'highlight.js/styles/github-dark.css';

// Register languages
highlight.registerLanguage('javascript', javascript);
highlight.registerLanguage('typescript', typescript);
highlight.registerLanguage('html', xml);
highlight.registerLanguage('css', css);
highlight.registerLanguage('python', python);
highlight.registerLanguage('markdown', markdown);
highlight.registerLanguage('json', json);
highlight.registerLanguage('jsx', javascript);
highlight.registerLanguage('tsx', typescript);

interface CodeEditorProps {
  code: string;
  language: string;
  onChange: (text: string) => void;
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

const CodeEditor: React.FC<CodeEditorProps> = ({ code, language, onChange }) => {
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
  
  const editorRef = useRef<any>(null);
  const inputRef = useRef<TextInput>(null);
  
  // Update internal state when code prop changes
  useEffect(() => {
    if (!isSaving && code !== value) {
      setValue(code);
      // Add to history when the code changes from outside
      addToHistory(code, selectionStart, selectionEnd);
      // Count lines for line numbers
      setLineCount(code.split('\n').length);
    }
  }, [code]);

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
    }
    
    // Add to history
    addToHistory(text, selStart, selEnd);
    
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
        inputRef.current.setSelection(
          historyItem.selectionStart,
          historyItem.selectionEnd
        );
      }

      // Update line count
      setLineCount(historyItem.value.split('\n').length);
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
        inputRef.current.setSelection(
          historyItem.selectionStart,
          historyItem.selectionEnd
        );
      }

      // Update line count
      setLineCount(historyItem.value.split('\n').length);
    }
  };

  const handleSave = () => {
    if (currentFile) {
      saveFile(currentFile.id, value);
    }
  };

  // Track selection changes
  const handleSelectionChange = (e: any) => {
    setSelectionStart(e.nativeEvent.selection.start);
    setSelectionEnd(e.nativeEvent.selection.end);
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
      inputRef.current.setSelection(newCursorPosition, newCursorPosition);
    }
    
    // Add to history
    addToHistory(newValue, newCursorPosition, newCursorPosition);

    // Update line count
    setLineCount(newValue.split('\n').length);
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
      return highlight(code, { language: lang }).value;
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
        <Text 
          key={i} 
          style={[
            styles.lineNumber, 
            { color: colors.textSecondary }
          ]}
        >
          {i}
        </Text>
      );
    }
    return numbers;
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
    inputRef.current.setSelection(matchPos, matchPos + searchText.length);
    
    setSelectionStart(matchPos);
    setSelectionEnd(matchPos + searchText.length);
    setCurrentMatchIndex(index);
    
    // Scroll to the match
    // This is limited in React Native, but we can try to ensure the match is visible
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
    
    // Clear matches
    setCurrentFindMatches([]);
    setCurrentMatchIndex(-1);
    
    return count;
  };

  // Helper function to escape special regex characters
  const escapeRegExp = (string: string): string => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Use KeyboardAvoidingView on mobile platforms
  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.codeBackground }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {showFindReplace && (
        <FindReplaceBar
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
      
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[styles.toolbarButton, { backgroundColor: colors.surface }]}
          onPress={() => {
            setShowFindReplace(true);
            setShowReplace(false);
          }}
        >
          <Search size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.toolbarButton, { backgroundColor: colors.surface }]}
          onPress={handleSave}
        >
          <Save 
            size={20} 
            color={currentFile && hasUnsavedChanges(currentFile.id) ? colors.primary : colors.textSecondary} 
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.editorContainer}>
        <View style={styles.lineNumbersContainer}>
          {renderLineNumbers()}
        </View>
        
        <ScrollView style={styles.scrollContainer}>
          <View ref={editorRef}>
            <TextInput
              ref={inputRef}
              style={{
                fontFamily: 'FiraCode-Regular',
                fontSize: editorSettings.fontSize,
                lineHeight: editorSettings.fontSize * 1.5,
                color: colors.text,
                backgroundColor: colors.codeBackground,
                padding: 16,
                paddingLeft: 0, // Remove left padding as line numbers take that space
                minHeight: 300,
              }}
              multiline
              value={value}
              onChangeText={handleValueChange}
              onSelectionChange={handleSelectionChange}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
            />
          </View>
        </ScrollView>
      </View>
      
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  editorContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  lineNumbersContainer: {
    paddingTop: 16,
    paddingRight: 8,
    paddingLeft: 8,
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  lineNumber: {
    fontFamily: 'FiraCode-Regular',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'right',
    width: 30,
  },
  scrollContainer: {
    flex: 1,
  },
  toolbar: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 5,
    flexDirection: 'row',
  },
  toolbarButton: {
    padding: 8,
    borderRadius: 4,
    marginLeft: 4,
  },
});

export default CodeEditor;