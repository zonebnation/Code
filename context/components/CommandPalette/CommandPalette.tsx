import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Modal, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { X, Search } from 'lucide-react-native';
import CommandService, { Command } from '@/services/CommandService';

interface CommandPaletteProps {
  isVisible: boolean;
  onClose: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ 
  isVisible, 
  onClose
}) => {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [filteredCommands, setFilteredCommands] = useState<Command[]>([]);
  const inputRef = useRef<TextInput>(null);
  
  useEffect(() => {
    if (isVisible) {
      setQuery('');
      setFilteredCommands(CommandService.getAllCommands());
      
      // Focus the input when opened
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [isVisible]);
  
  useEffect(() => {
    setFilteredCommands(CommandService.searchCommands(query));
  }, [query]);
  
  const executeCommand = (command: Command) => {
    CommandService.executeCommand(command.id);
    onClose();
  };
  
  const renderCommandItem = ({ item }: { item: Command }) => (
    <TouchableOpacity
      style={styles.commandItem}
      onPress={() => executeCommand(item)}
    >
      <Text style={[styles.commandTitle, { color: colors.text }]}>
        {item.title}
      </Text>
      
      <View style={styles.commandMeta}>
        <Text style={[styles.commandCategory, { color: colors.textSecondary }]}>
          {item.category}
        </Text>
        {item.shortcut && (
          <Text style={[styles.commandShortcut, { color: colors.primary }]}>
            {item.shortcut}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
  
  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View 
          style={[
            styles.palette, 
            { backgroundColor: colors.surface, borderColor: colors.border }
          ]}
        >
          <View 
            style={[
              styles.searchContainer,
              { borderBottomColor: colors.border }
            ]}
          >
            <Search 
              size={16} 
              color={colors.textSecondary} 
              style={styles.searchIcon} 
            />
            <TextInput
              ref={inputRef}
              style={[styles.searchInput, { color: colors.text }]}
              value={query}
              onChangeText={setQuery}
              placeholder="Type to search commands..."
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
            />
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
            >
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={filteredCommands}
            renderItem={renderCommandItem}
            keyExtractor={item => item.id}
            style={styles.commandsList}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={[styles.noResults, { color: colors.textSecondary }]}>
                No commands found
              </Text>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 100,
  },
  palette: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  closeButton: {
    padding: 4,
  },
  commandsList: {
    maxHeight: 400,
  },
  commandItem: {
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  commandTitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 2,
  },
  commandMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  commandCategory: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  commandShortcut: {
    fontFamily: 'FiraCode-Regular',
    fontSize: 12,
  },
  noResults: {
    padding: 16,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
});

export default CommandPalette;