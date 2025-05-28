import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useProject } from '@/context/ProjectContext';
import { Search as SearchIcon, X, ArrowLeft } from 'lucide-react-native';
import SearchService, { SearchOptions } from '@/services/SearchService';
import { FileSearchResult } from '@/types/editor';
import SearchResultItem from './SearchResultItem';

interface GlobalSearchProps {
  onClose: () => void;
  onFileSelect?: (fileId: string, lineNumber: number) => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ onClose, onFileSelect }) => {
  const { colors } = useTheme();
  const { currentProject, fileTree, openFile } = useProject();
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
      onFileSelect?.(fileId, lineNumber || 0);
      onClose();
    }
  };

  if (!currentProject) {
    return (
      <View 
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <ArrowLeft size={20} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Search</Text>
        </View>
        <View style={styles.noProject}>
          <Text style={{ color: colors.textSecondary }}>Please open a project first</Text>
        </View>
      </View>
    );
  }

  return (
    <View 
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View 
        style={[styles.header, { borderBottomColor: colors.border }]}
      >
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <ArrowLeft size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Search</Text>
      </View>

      <View style={styles.searchWrapper}>
        <View style={styles.searchBarContainer}>
          <View style={styles.searchInputContainer}>
            <SearchIcon size={16} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[
                styles.searchInput,
                { 
                  color: colors.text,
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }
              ]}
              placeholder="Search in files..."
              value={query}
              onChangeText={setQuery}
              placeholderTextColor={colors.textSecondary}
            />
            {query ? (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setQuery('')}
              >
                <X size={14} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={styles.searchOptions}>
          <TouchableOpacity 
            style={styles.optionButton} 
            onPress={() => toggleOption('matchCase')}
          >
            <View style={[
              styles.optionIndicator, 
              options.matchCase && { backgroundColor: colors.primary }
            ]} />
            <Text style={{ color: colors.text }}>Match Case</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionButton} 
            onPress={() => toggleOption('wholeWord')}
          >
            <View style={[
              styles.optionIndicator, 
              options.wholeWord && { backgroundColor: colors.primary }
            ]} />
            <Text style={{ color: colors.text }}>Whole Word</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionButton} 
            onPress={() => toggleOption('useRegex')}
          >
            <View style={[
              styles.optionIndicator, 
              options.useRegex && { backgroundColor: colors.primary }
            ]} />
            <Text style={{ color: colors.text }}>Use Regex</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.resultsSummary}>
        {query ? (
          <Text style={{ color: colors.textSecondary }}>
            {isSearching ? 'Searching...' : `${totalMatches} results in ${searchResults.length} files`}
          </Text>
        ) : null}
      </View>

      <ScrollView style={styles.resultsContainer}>
        {searchResults.map((result) => (
          <View key={result.fileId} style={styles.fileResult}>
            <TouchableOpacity 
              style={styles.fileHeader}
              onPress={() => handleFileSelect(result.fileId)}
            >
              <Text style={[styles.fileName, { color: colors.primary }]}>
                {result.fileName}
              </Text>
              <Text style={[styles.matchCount, { color: colors.textSecondary }]}>
                {result.matches.length} matches
              </Text>
            </TouchableOpacity>
            
            {result.matches.map((match, i) => (
              <SearchResultItem
                key={`${result.fileId}-${match.lineNumber}-${i}`}
                match={match}
                onPress={() => handleFileSelect(result.fileId, match.lineNumber)}
              />
            ))}
          </View>
        ))}
        
        {query && !isSearching && searchResults.length === 0 && (
          <Text style={[styles.noResults, { color: colors.textSecondary }]}>
            No matches found
          </Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
  },
  searchWrapper: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  searchBarContainer: {
    marginBottom: 12,
  },
  searchInputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: 4,
    borderWidth: 1,
    paddingLeft: 36,
    paddingRight: 36,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  clearButton: {
    position: 'absolute',
    right: 12,
  },
  searchOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  optionIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 6,
  },
  resultsSummary: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  resultsContainer: {
    flex: 1,
  },
  fileResult: {
    marginBottom: 16,
  },
  fileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
  },
  fileName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  matchCount: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  noResults: {
    padding: 24,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  noProject: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GlobalSearch;