import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Undo, Redo, Save } from 'lucide-react-native';

interface ExtendedKeyboardProps {
  onKeyPress: (key: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  canUndo: boolean;
  canRedo: boolean;
  tabSize: number;
  useTabs: boolean;
}

const ExtendedKeyboard: React.FC<ExtendedKeyboardProps> = ({
  onKeyPress,
  onUndo,
  onRedo,
  onSave,
  canUndo,
  canRedo,
  tabSize = 2,
  useTabs = false
}) => {
  const { colors } = useTheme();
  
  // Common programming symbols
  const symbols = [
    '(', ')', '{', '}', '[', ']', '<', '>', '/', '\\', '|',
    '&', '!', '.', ',', ';', ':', "'", '"', '_', '-', '+',
    '=', '*', '%', '$', '#', '@', '~', '`'
  ];

  const handleTabPress = () => {
    if (useTabs) {
      onKeyPress('\t');
    } else {
      // Insert spaces based on tab size
      onKeyPress(' '.repeat(tabSize));
    }
  };

  return (
    <View 
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderTopColor: colors.border }
      ]}
    >
      <View style={styles.historyButtons}>
        <TouchableOpacity
          style={[
            styles.historyButton,
            { opacity: canUndo ? 1 : 0.5 }
          ]}
          onPress={onUndo}
          disabled={!canUndo}
        >
          <Undo size={20} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.historyButton,
            { opacity: canRedo ? 1 : 0.5 }
          ]}
          onPress={onRedo}
          disabled={!canRedo}
        >
          <Redo size={20} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={onSave}
        >
          <Save size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.keysScroll}
        contentContainerStyle={styles.keysContainer}
      >
        <TouchableOpacity
          style={[styles.tabKey, { backgroundColor: colors.primary }]}
          onPress={handleTabPress}
        >
          <Text style={[styles.tabKeyText, { color: '#FFFFFF' }]}>Tab</Text>
        </TouchableOpacity>
        
        {symbols.map((symbol, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.key, { backgroundColor: colors.background }]}
            onPress={() => onKeyPress(symbol)}
          >
            <Text style={[styles.keyText, { color: colors.text }]}>{symbol}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  historyButtons: {
    flexDirection: 'row',
    marginRight: 12,
  },
  historyButton: {
    padding: 8,
    marginRight: 4,
    borderRadius: 4,
  },
  keysScroll: {
    flex: 1,
  },
  keysContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  key: {
    height: 40,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
    borderRadius: 4,
  },
  keyText: {
    fontSize: 18,
    fontFamily: 'FiraCode-Regular',
  },
  tabKey: {
    height: 40,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderRadius: 4,
  },
  tabKeyText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
});

export default ExtendedKeyboard;