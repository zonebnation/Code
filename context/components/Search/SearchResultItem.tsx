import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { SearchMatch } from '@/types/editor';

interface SearchResultItemProps {
  match: SearchMatch;
  onPress: () => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({ match, onPress }) => {
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
  const maxLength = 60;
  const trimLine = (text: string, side: 'start' | 'end') => {
    if (text.length <= maxLength / 2) return text;
    
    if (side === 'start') {
      return '...' + text.substring(text.length - maxLength / 2);
    } else {
      return text.substring(0, maxLength / 2) + '...';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.surface }
      ]}
      onPress={onPress}
    >
      <Text style={[styles.lineNumber, { color: colors.textSecondary }]}>
        {lineNumber}
      </Text>
      <View style={styles.lineContent}>
        <Text style={[styles.codePart, { color: colors.text }]}>
          {trimLine(beforeMatch, 'start')}
          <Text style={[
            styles.matchedText, 
            { 
              backgroundColor: colors.selectedItem,
              color: colors.textHighlight
            }
          ]}>
            {matchedText}
          </Text>
          {trimLine(afterMatch, 'end')}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  lineNumber: {
    width: 40,
    textAlign: 'right',
    paddingRight: 8,
    fontFamily: 'FiraCode-Regular',
    fontSize: 12,
  },
  lineContent: {
    flex: 1,
  },
  codePart: {
    fontFamily: 'FiraCode-Regular',
    fontSize: 12,
  },
  matchedText: {
    fontFamily: 'FiraCode-Regular',
    fontSize: 12,
    padding: 1,
    borderRadius: 2,
  }
});

export default SearchResultItem;