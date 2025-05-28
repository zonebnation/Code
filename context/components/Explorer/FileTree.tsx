import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useProject } from '@/context/ProjectContext';
import { 
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  FolderOpen
} from 'lucide-react-native';
import { File } from '@/types/editor';

interface FileItemProps {
  file: File;
  level: number;
}

const FileItem: React.FC<FileItemProps> = ({ file, level }) => {
  const { colors } = useTheme();
  const { fileTree, openFile } = useProject();
  const [expanded, setExpanded] = useState(true);
  
  const isDirectory = file.type === 'directory';
  const hasChildren = isDirectory && file.children && file.children.length > 0;
  
  const toggleExpand = () => {
    setExpanded(!expanded);
  };
  
  const handlePress = () => {
    if (isDirectory) {
      toggleExpand();
    } else {
      openFile(file);
    }
  };
  
  const indent = level * 12;
  
  return (
    <View>
      <TouchableOpacity
        style={[
          styles.fileItem,
          { paddingLeft: 16 + indent },
        ]}
        onPress={handlePress}
      >
        <View style={styles.fileIcon}>
          {isDirectory ? (
            hasChildren ? (
              expanded ? (
                <ChevronDown size={14} color={colors.textSecondary} />
              ) : (
                <ChevronRight size={14} color={colors.textSecondary} />
              )
            ) : (
              <View style={{ width: 14 }} />
            )
          ) : (
            <View style={{ width: 14 }} />
          )}
        </View>
        
        <View style={styles.fileTypeIcon}>
          {isDirectory ? (
            expanded ? (
              <FolderOpen size={16} color="#FFCA28" />
            ) : (
              <Folder size={16} color="#FFCA28" />
            )
          ) : (
            <FileText size={16} color={colors.primary} />
          )}
        </View>
        
        <Text
          style={[
            styles.fileName,
            { color: colors.text },
          ]}
          numberOfLines={1}
        >
          {file.name}
        </Text>
      </TouchableOpacity>
      
      {isDirectory && expanded && hasChildren && (
        <View>
          {file.children?.map((childId) => {
            const childFile = fileTree.find((f) => f.id === childId);
            if (childFile) {
              return (
                <FileItem
                  key={childFile.id}
                  file={childFile}
                  level={level + 1}
                />
              );
            }
            return null;
          })}
        </View>
      )}
    </View>
  );
};

const FileTree: React.FC = () => {
  const { colors } = useTheme();
  const { fileTree } = useProject();
  
  // Get only root files (files without parents or at the top level)
  const rootFiles = fileTree.filter((file) => {
    // Check if this file is not a child of any other directory
    return !fileTree.some((parentFile) => 
      parentFile.type === 'directory' && 
      parentFile.children?.includes(file.id)
    );
  });
  
  return (
    <ScrollView style={styles.container}>
      {rootFiles.map((file) => (
        <FileItem key={file.id} file={file} level={0} />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  fileIcon: {
    width: 16,
    marginRight: 4,
  },
  fileTypeIcon: {
    marginRight: 8,
  },
  fileName: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
});

export default FileTree;