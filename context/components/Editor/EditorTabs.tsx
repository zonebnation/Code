import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useProject } from '@/context/ProjectContext';
import { 
  ChevronRight,
  ChevronDown,
  X,
  Circle 
} from 'lucide-react-native';

const EditorTabs: React.FC = () => {
  const { colors } = useTheme();
  const { openFiles, currentFile, setCurrentFile, closeFile, hasUnsavedChanges } = useProject();

  return (
    <View 
      style={[
        styles.container, 
        { 
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {openFiles.map((file) => {
          const isActive = currentFile?.id === file.id;
          const isUnsaved = hasUnsavedChanges(file.id);
          
          return (
            <Pressable
              key={file.id}
              style={[
                styles.tab,
                {
                  backgroundColor: isActive ? colors.background : colors.surface,
                  borderBottomColor: isActive ? colors.primary : 'transparent',
                },
              ]}
              onPress={() => setCurrentFile(file.id)}
            >
              <Text 
                style={[
                  styles.tabText, 
                  { 
                    color: isActive ? colors.text : colors.textSecondary,
                    fontFamily: isActive ? 'Inter-Medium' : 'Inter-Regular',
                  },
                ]}
                numberOfLines={1}
              >
                {file.name}
                {isUnsaved && (
                  <Text style={{ color: colors.primary }}> •</Text>
                )}
              </Text>
              
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => closeFile(file.id)}
              >
                <X 
                  size={14} 
                  color={isActive ? colors.text : colors.textSecondary} 
                />
              </TouchableOpacity>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  scrollContent: {
    flexDirection: 'row',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 100,
    maxWidth: 160,
    borderBottomWidth: 2,
  },
  tabText: {
    flex: 1,
    fontSize: 13,
  },
  closeButton: {
    marginLeft: 8,
    padding: 2,
  },
});

export default EditorTabs;