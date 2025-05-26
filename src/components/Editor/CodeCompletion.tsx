import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import styles from './CodeCompletion.module.css';

export interface CompletionItem {
  label: string;
  kind: string;
  detail?: string;
  documentation?: string;
  insertText: string;
}

interface CodeCompletionProps {
  items: CompletionItem[];
  position: { top: number; left: number };
  onSelect: (item: CompletionItem) => void;
  onCancel: () => void;
}

const CodeCompletion: React.FC<CodeCompletionProps> = ({
  items,
  position,
  onSelect,
  onCancel
}) => {
  const { colors } = useTheme();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev < items.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          if (items[selectedIndex]) {
            onSelect(items[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onCancel();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedIndex, onSelect, onCancel]);

  // Scroll selected item into view
  useEffect(() => {
    if (containerRef.current && items.length > 0) {
      const selectedElement = containerRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (items.length === 0) return null;

  const getIconForKind = (kind: string) => {
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
      default:
        return '•';
    }
  };

  return (
    <div
      ref={containerRef}
      className={styles.container}
      style={{
        top: position.top,
        left: position.left,
        backgroundColor: colors.surface,
        borderColor: colors.border,
      }}
    >
      {items.map((item, index) => (
        <div
          key={`${item.label}-${index}`}
          className={`${styles.item} ${index === selectedIndex ? styles.selected : ''}`}
          style={{
            backgroundColor: index === selectedIndex ? colors.selectedItem : 'transparent',
          }}
          onClick={() => onSelect(item)}
          data-index={index}
        >
          <div 
            className={styles.icon}
            style={{ 
              color: index === selectedIndex ? colors.textHighlight : colors.primary 
            }}
          >
            {getIconForKind(item.kind)}
          </div>
          <div className={styles.content}>
            <div 
              className={styles.label}
              style={{ color: index === selectedIndex ? colors.textHighlight : colors.text }}
            >
              {item.label}
            </div>
            {item.detail && (
              <div 
                className={styles.detail}
                style={{ color: colors.textSecondary }}
              >
                {item.detail}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CodeCompletion;