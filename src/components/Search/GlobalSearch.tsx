import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useProject } from '../../context/ProjectContext';
import { Search as SearchIcon, X, ArrowLeft } from 'lucide-react';
import SearchService, { SearchOptions } from '../../services/SearchService';
import { FileSearchResult } from '../../types/editor';
import SearchResultItem from './SearchResultItem';
import styles from './GlobalSearch.module.css';

interface GlobalSearchProps {
  onClose: () => void;
  onFileSelect?: (fileId: string, lineNumber: number) => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ onClose, onFileSelect }) => {
  const { colors } = useTheme();
  const { currentProject, fileTree, openFile, setCurrentFile } = useProject();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FileSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [totalMatches, setTotalMatches] = useState(0);
  const [options, setOptions] = useState<SearchOptions>({
    matchCase: false,
    wholeWord: false,
    useRegex: false,
  });

  // Perform search when query or options change
  useEffect(() => {
    if (!currentProject || !query.trim()) {
      setSearchResults([]);
      setTotalMatches(0);
      return;
    }

    // Debounce search to prevent too frequent searches
    const timer = setTimeout(() => {
      setIsSearching(true);
      
      try {
        const results = SearchService.searchFiles(query, options, {
          projectId: currentProject.id,
          fileTree,
        });
        
        setSearchResults(results);
        
        // Calculate total number of matches
        const total = results.reduce((sum, file) => sum + file.matches.length, 0);
        setTotalMatches(total);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, options, currentProject, fileTree]);

  // Toggle search options
  const toggleOption = (optionName: keyof SearchOptions) => {
    setOptions(prev => ({
      ...prev,
      [optionName]: !prev[optionName],
    }));
  };

  // Handle file selection to open it in the editor
  const handleFileSelect = (fileId: string, lineNumber?: number) => {
    const file = fileTree.find(f => f.id === fileId);
    if (file && file.type === 'file') {
      openFile(file);
      
      // If a line number is provided, we should position the cursor there
      // This requires an extension to the current editor implementation
      
      onFileSelect?.(fileId, lineNumber || 0);
      onClose();
    }
  };

  if (!currentProject) {
    return (
      <div 
        className={styles.container}
        style={{ backgroundColor: colors.background }}
      >
        <div className={styles.header} style={{ borderBottomColor: colors.border }}>
          <button className={styles.backButton} onClick={onClose}>
            <ArrowLeft size={20} color={colors.primary} />
          </button>
          <h2 className={styles.title} style={{ color: colors.text }}>Search</h2>
        </div>
        <div className={styles.noProject}>
          <p style={{ color: colors.textSecondary }}>Please open a project first</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={styles.container}
      style={{ backgroundColor: colors.background }}
    >
      <div 
        className={styles.header}
        style={{ borderBottomColor: colors.border }}
      >
        <button className={styles.backButton} onClick={onClose}>
          <ArrowLeft size={20} color={colors.primary} />
        </button>
        <h2 className={styles.title} style={{ color: colors.text }}>Search</h2>
      </div>

      <div className={styles.searchWrapper}>
        <div className={styles.searchBarContainer}>
          <div className={styles.searchInputContainer}>
            <SearchIcon size={16} color={colors.textSecondary} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              style={{ 
                color: colors.text,
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
              placeholder="Search in files..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            {query && (
              <button
                className={styles.clearButton}
                onClick={() => setQuery('')}
              >
                <X size={14} color={colors.textSecondary} />
              </button>
            )}
          </div>
        </div>

        <div className={styles.searchOptions}>
          <label className={styles.optionLabel}>
            <input
              type="checkbox"
              checked={options.matchCase}
              onChange={() => toggleOption('matchCase')}
            />
            <span style={{ color: colors.text }}>Match Case</span>
          </label>
          
          <label className={styles.optionLabel}>
            <input
              type="checkbox"
              checked={options.wholeWord}
              onChange={() => toggleOption('wholeWord')}
            />
            <span style={{ color: colors.text }}>Whole Word</span>
          </label>
          
          <label className={styles.optionLabel}>
            <input
              type="checkbox"
              checked={options.useRegex}
              onChange={() => toggleOption('useRegex')}
            />
            <span style={{ color: colors.text }}>Use Regex</span>
          </label>
        </div>
      </div>

      <div className={styles.resultsSummary}>
        {query && (
          <p style={{ color: colors.textSecondary }}>
            {isSearching ? 'Searching...' : `${totalMatches} results in ${searchResults.length} files`}
          </p>
        )}
      </div>

      <div className={styles.resultsContainer}>
        {searchResults.map((result) => (
          <div key={result.fileId} className={styles.fileResult}>
            <div 
              className={styles.fileHeader}
              style={{ color: colors.primary }}
              onClick={() => handleFileSelect(result.fileId)}
            >
              <span className={styles.fileName}>{result.fileName}</span>
              <span className={styles.matchCount}>{result.matches.length} matches</span>
            </div>
            
            {result.matches.map((match, i) => (
              <SearchResultItem
                key={`${result.fileId}-${match.lineNumber}-${i}`}
                match={match}
                onClick={() => handleFileSelect(result.fileId, match.lineNumber)}
              />
            ))}
          </div>
        ))}
        
        {query && !isSearching && searchResults.length === 0 && (
          <p className={styles.noResults} style={{ color: colors.textSecondary }}>
            No matches found
          </p>
        )}
      </div>
    </div>
  );
};

export default GlobalSearch;