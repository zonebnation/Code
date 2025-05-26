import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Search, ArrowDown, ArrowUp, Replace, X, Check } from 'lucide-react';
import styles from './FindReplaceBar.module.css';

export interface FindOptions {
  matchCase: boolean;
  wholeWord: boolean;
}

interface FindReplaceBarProps {
  value: string;
  onFind: (searchValue: string, options: FindOptions) => number;
  onFindNext: () => void;
  onFindPrevious: () => void;
  onReplace: (replaceValue: string) => void;
  onReplaceAll: (findValue: string, replaceValue: string, options: FindOptions) => number;
  onClose: () => void;
  showReplace: boolean;
  toggleShowReplace: () => void;
}

const FindReplaceBar: React.FC<FindReplaceBarProps> = ({
  value,
  onFind,
  onFindNext,
  onFindPrevious,
  onReplace,
  onReplaceAll,
  onClose,
  showReplace,
  toggleShowReplace
}) => {
  const { colors } = useTheme();
  const [findValue, setFindValue] = useState('');
  const [replaceValue, setReplaceValue] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const findInputRef = useRef<HTMLInputElement>(null);

  // Focus the find input when the bar is opened
  useEffect(() => {
    if (findInputRef.current) {
      findInputRef.current.focus();
    }
  }, []);

  // Handle search when options or search text changes
  useEffect(() => {
    if (findValue) {
      const count = onFind(findValue, { matchCase, wholeWord });
      setMatchCount(count);
    }
  }, [findValue, matchCase, wholeWord]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter - Find next
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onFindNext();
    }
    
    // Shift+Enter - Find previous
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      onFindPrevious();
    }
    
    // Escape - Close
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleReplace = () => {
    onReplace(replaceValue);
  };

  const handleReplaceAll = () => {
    const count = onReplaceAll(findValue, replaceValue, { matchCase, wholeWord });
    setMatchCount(0); // Reset count after replace all
    // Show a success message with the number of replacements
    alert(`${count} occurrences replaced.`);
  };

  return (
    <div 
      className={styles.container}
      style={{ 
        backgroundColor: colors.surface,
        borderColor: colors.border,
      }}
    >
      <div className={styles.findSection}>
        <div className={styles.inputGroup}>
          <div className={styles.inputWrapper}>
            <Search size={16} color={colors.textSecondary} className={styles.inputIcon} />
            <input
              ref={findInputRef}
              className={styles.input}
              style={{ color: colors.text, backgroundColor: colors.background }}
              value={findValue}
              onChange={(e) => setFindValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Find"
            />
          </div>
          
          <div className={styles.matchInfo} style={{ color: colors.textSecondary }}>
            {findValue && `${matchCount} matches`}
          </div>
          
          <div className={styles.actions}>
            <button 
              className={styles.actionButton}
              onClick={onFindPrevious}
              disabled={!findValue}
              title="Previous match (Shift+Enter)"
            >
              <ArrowUp size={16} color={colors.textSecondary} />
            </button>
            <button 
              className={styles.actionButton}
              onClick={onFindNext}
              disabled={!findValue}
              title="Next match (Enter)"
            >
              <ArrowDown size={16} color={colors.textSecondary} />
            </button>
            <button 
              className={styles.actionButton}
              onClick={toggleShowReplace}
              title={showReplace ? "Hide replace" : "Show replace"}
            >
              <Replace size={16} color={colors.textSecondary} />
            </button>
            <button 
              className={styles.actionButton}
              onClick={onClose}
              title="Close (Escape)"
            >
              <X size={16} color={colors.textSecondary} />
            </button>
          </div>
        </div>
        
        <div className={styles.options}>
          <label className={styles.optionLabel}>
            <input
              type="checkbox"
              checked={matchCase}
              onChange={() => setMatchCase(!matchCase)}
            />
            <span style={{ color: colors.text }}>Match case</span>
          </label>
          
          <label className={styles.optionLabel}>
            <input
              type="checkbox"
              checked={wholeWord}
              onChange={() => setWholeWord(!wholeWord)}
            />
            <span style={{ color: colors.text }}>Whole word</span>
          </label>
        </div>
      </div>
      
      {showReplace && (
        <div className={styles.replaceSection}>
          <div className={styles.inputGroup}>
            <div className={styles.inputWrapper}>
              <Replace size={16} color={colors.textSecondary} className={styles.inputIcon} />
              <input
                className={styles.input}
                style={{ color: colors.text, backgroundColor: colors.background }}
                value={replaceValue}
                onChange={(e) => setReplaceValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Replace"
              />
            </div>
            
            <div className={styles.actions}>
              <button 
                className={styles.actionButton}
                onClick={handleReplace}
                disabled={!findValue}
                title="Replace current match"
              >
                <Check size={16} color={colors.textSecondary} />
                <span className={styles.buttonText}>Replace</span>
              </button>
              
              <button 
                className={`${styles.actionButton} ${styles.replaceAllButton}`}
                onClick={handleReplaceAll}
                disabled={!findValue}
                title="Replace all matches"
              >
                <span className={styles.buttonText}>Replace All</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindReplaceBar;