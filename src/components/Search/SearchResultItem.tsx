import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { SearchMatch } from '../../types/editor';
import styles from './SearchResultItem.module.css';

interface SearchResultItemProps {
  match: SearchMatch;
  onClick: () => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({ match, onClick }) => {
  const { colors } = useTheme();
  
  const {
    lineNumber,
    lineContent,
    matchStartIndex,
    matchEndIndex,
  } = match;

  // Prepare parts for highlighted display
  const beforeMatch = lineContent.substring(0, matchStartIndex);
  const matchedText = lineContent.substring(matchStartIndex, matchEndIndex);
  const afterMatch = lineContent.substring(matchEndIndex);
  
  // Trim long lines for better display
  const maxLength = 100;
  const trimLine = (text: string, side: 'start' | 'end') => {
    if (text.length <= maxLength / 2) return text;
    
    if (side === 'start') {
      return '...' + text.substring(text.length - maxLength / 2);
    } else {
      return text.substring(0, maxLength / 2) + '...';
    }
  };

  return (
    <div
      className={styles.container}
      onClick={onClick}
      style={{ backgroundColor: colors.surface }}
    >
      <div className={styles.lineNumber} style={{ color: colors.textSecondary }}>
        {lineNumber}
      </div>
      <div className={styles.lineContent}>
        <span className={styles.codePart}>{trimLine(beforeMatch, 'start')}</span>
        <span className={styles.matchedText} style={{ backgroundColor: colors.selectedItem, color: colors.textHighlight }}>
          {matchedText}
        </span>
        <span className={styles.codePart}>{trimLine(afterMatch, 'end')}</span>
      </div>
    </div>
  );
};

export default SearchResultItem;