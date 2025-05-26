import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Search, ArrowDown, ArrowUp, Replace, X, Check } from 'lucide-react-native';

export interface FindOptions {
  matchCase: boolean;
  wholeWord: boolean;
}

interface FindReplaceBarProps {
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

  // Handle search when options or search text changes
  useEffect(() => {
    if (findValue) {
      const count = onFind(findValue, { matchCase, wholeWord });
      setMatchCount(count);
    }
  }, [findValue, matchCase, wholeWord]);

  const handleReplace = () => {
    onReplace(replaceValue);
  };

  const handleReplaceAll = () => {
    const count = onReplaceAll(findValue, replaceValue, { matchCase, wholeWord });
    setMatchCount(0); // Reset count after replace all
    alert(`${count} occurrences replaced.`);
  };

  return (
    <View 
      style={[
        styles.container, 
        { 
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        }
      ]}
    >
      <View style={styles.findSection}>
        <View style={styles.inputRow}>
          <View style={styles.inputWrapper}>
            <Search size={16} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[
                styles.input,
                { color: colors.text, backgroundColor: colors.background }
              ]}
              value={findValue}
              onChangeText={setFindValue}
              placeholder="Find"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onFindPrevious}
              disabled={!findValue}
            >
              <ArrowUp size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onFindNext}
              disabled={!findValue}
            >
              <ArrowDown size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={toggleShowReplace}
            >
              <Replace size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onClose}
            >
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.optionsRow}>
          <Text style={[styles.matchCount, { color: colors.textSecondary }]}>
            {findValue ? `${matchCount} matches` : ''}
          </Text>
          
          <View style={styles.options}>
            <View style={styles.optionItem}>
              <Text style={[styles.optionLabel, { color: colors.text }]}>
                Match case
              </Text>
              <Switch
                value={matchCase}
                onValueChange={setMatchCase}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>
            
            <View style={styles.optionItem}>
              <Text style={[styles.optionLabel, { color: colors.text }]}>
                Whole word
              </Text>
              <Switch
                value={wholeWord}
                onValueChange={setWholeWord}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>
          </View>
        </View>
      </View>
      
      {showReplace && (
        <View style={styles.replaceSection}>
          <View style={styles.inputRow}>
            <View style={styles.inputWrapper}>
              <Replace size={16} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[
                  styles.input,
                  { color: colors.text, backgroundColor: colors.background }
                ]}
                value={replaceValue}
                onChangeText={setReplaceValue}
                placeholder="Replace"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            
            <TouchableOpacity
              style={[
                styles.replaceButton,
                { backgroundColor: colors.primary }
              ]}
              onPress={handleReplace}
              disabled={!findValue}
            >
              <Text style={styles.replaceButtonText}>Replace</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.replaceButton,
                { backgroundColor: colors.primary }
              ]}
              onPress={handleReplaceAll}
              disabled={!findValue}
            >
              <Text style={styles.replaceButtonText}>Replace All</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  findSection: {
    marginBottom: 4,
  },
  replaceSection: {
    marginTop: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 8,
    zIndex: 1,
  },
  input: {
    flex: 1,
    height: 36,
    borderRadius: 4,
    paddingLeft: 32,
    paddingRight: 8,
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  actionButton: {
    padding: 6,
    marginLeft: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  matchCount: {
    fontSize: 12,
  },
  options: {
    flexDirection: 'row',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  optionLabel: {
    fontSize: 12,
    marginRight: 8,
  },
  replaceButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  replaceButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default FindReplaceBar;