import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import AICompletionService from '../../services/AICompletionService';
import { CompletionItem } from './CodeCompletion';
import { AlertCircle, Zap } from 'lucide-react';

interface AICodeSuggestionProps {
  code: string;
  language: string;
  position: number;
  prefix: string;
  onSelect: (completion: string) => void;
  visible: boolean;
}

const AICodeSuggestion: React.FC<AICodeSuggestionProps> = ({
  code,
  language,
  position,
  prefix,
  onSelect,
  visible
}) => {
  const { colors } = useTheme();
  const [suggestions, setSuggestions] = useState<CompletionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible || !prefix) {
      setSuggestions([]);
      return;
    }

    // Reset selection when prefix changes
    setSelectedIndex(0);

    // Debounce AI suggestions to avoid too many requests
    const debounceTimer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const result = await AICompletionService.getCompletions(code, position, language, prefix);
        setSuggestions(result.suggestions);
        setIsLoading(false);
        setError(result.error);
      } catch (err) {
        setIsLoading(false);
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error fetching AI suggestions:', err);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [code, position, language, prefix, visible]);

  // Handle keyboard navigation for suggestions
  useEffect(() => {
    if (!visible || suggestions.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          if (suggestions[selectedIndex]) {
            onSelect(suggestions[selectedIndex].insertText);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setSuggestions([]);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, suggestions, selectedIndex, onSelect]);

  // Scroll selected item into view
  useEffect(() => {
    if (visible && suggestionRef.current) {
      const selectedElement = suggestionRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, visible]);

  if (!visible || suggestions.length === 0) {
    return null;
  }

  return (
    <div
      ref={suggestionRef}
      style={{
        position: 'absolute',
        maxHeight: '200px',
        maxWidth: '350px',
        width: 'auto',
        overflowY: 'auto',
        zIndex: 50,
        borderRadius: '4px',
        border: `1px solid ${colors.border}`,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        backgroundColor: colors.surface,
      }}
    >
      {isLoading && (
        <div
          style={{
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderBottom: `1px solid ${colors.border}`,
            color: colors.textSecondary,
            fontSize: '13px',
          }}
        >
          <Zap size={14} color={colors.primary} />
          <span>Generating AI suggestions...</span>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderBottom: `1px solid ${colors.border}`,
            color: colors.error,
            fontSize: '13px',
          }}
        >
          <AlertCircle size={14} color={colors.error} />
          <span>{error}</span>
        </div>
      )}

      {suggestions.map((suggestion, index) => (
        <div
          key={`${suggestion.label}-${index}`}
          data-index={index}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            padding: '8px 10px',
            cursor: 'pointer',
            borderBottom: `1px solid ${colors.border}30`,
            backgroundColor: index === selectedIndex ? colors.selectedItem : 'transparent',
          }}
          onClick={() => onSelect(suggestion.insertText)}
        >
          <div
            style={{
              marginRight: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '20px',
              height: '20px',
              flexShrink: 0,
            }}
          >
            {suggestion.detail?.includes('AI') && (
              <Zap size={14} color={colors.primary} />
            )}
            {!suggestion.detail?.includes('AI') && (
              <div
                style={{
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  color: colors.primary,
                }}
              >
                {getIconForKind(suggestion.kind)}
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <div
              style={{
                fontSize: '13px',
                fontFamily: 'monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: index === selectedIndex ? colors.textHighlight : colors.text,
                fontWeight: index === selectedIndex ? 500 : 'normal',
              }}
            >
              {suggestion.label}
            </div>
            {suggestion.detail && (
              <div
                style={{
                  fontSize: '11px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: colors.textSecondary,
                }}
              >
                {suggestion.detail}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Helper to get icon for completion kind
function getIconForKind(kind: string): string {
  switch (kind) {
    case 'function':
      return 'ƒ';
    case 'variable':
      return 'α';
    case 'class':
      return 'C';
    case 'interface':
      return 'I';
    case 'property':
      return 'P';
    case 'keyword':
      return 'K';
    case 'method':
      return 'M';
    case 'snippet':
      return '{}';
    default:
      return '•';
  }
}

export default AICodeSuggestion;