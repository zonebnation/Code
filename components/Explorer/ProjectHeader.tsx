import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useProject } from '@/context/ProjectContext';
import { ChevronLeft, Folder } from 'lucide-react-native';

const ProjectHeader: React.FC = () => {
  const { colors } = useTheme();
  const { currentProject, selectProject, projects } = useProject();

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
      {currentProject ? (
        <>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => selectProject('')}
          >
            <ChevronLeft size={20} color={colors.primary} />
          </TouchableOpacity>
          
          <View style={styles.projectInfo}>
            <Folder size={16} color={colors.primary} style={styles.folderIcon} />
            <Text
              style={[styles.projectName, { color: colors.text }]}
              numberOfLines={1}
            >
              {currentProject.name}
            </Text>
          </View>
        </>
      ) : (
        <Text style={[styles.title, { color: colors.text }]}>
          Projects
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 8,
  },
  projectInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  folderIcon: {
    marginRight: 8,
  },
  projectName: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  title: {
    fontFamily: 'Inter-Medium',
    fontSize: 18,
  },
});

export default ProjectHeader;