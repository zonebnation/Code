import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useProject } from '@/context/ProjectContext';
import { Save, Share, Settings, Code, Type } from 'lucide-react-native';

interface EditorToolbarProps {
  onSave?: () => void;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ onSave }) => {
  const { colors } = useTheme();
  const { currentFile, hasUnsavedChanges } = useProject();
  
  const isUnsaved = currentFile ? hasUnsavedChanges(currentFile.id) : false;

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
      <View style={styles.fileInfo}>
        {currentFile && (
          <Text style={[styles.filePath, { color: colors.textSecondary }]}>
            {currentFile.path}
            {isUnsaved && (
              <Text style={{ color: colors.primary }}> • unsaved</Text>
            )}
          </Text>
        )}
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton}>
          <Type size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Code size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onSave}
        >
          <Save size={18} color={isUnsaved ? colors.primary : colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Share size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Settings size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  fileInfo: {
    flex: 1,
  },
  filePath: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 16,
    padding: 4,
  },
});

export default EditorToolbar;