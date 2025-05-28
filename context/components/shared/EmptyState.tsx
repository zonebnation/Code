import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { File, FileCode, FolderPlus, Terminal } from 'lucide-react-native';
import { router } from 'expo-router';

interface EmptyStateProps {
  icon: 'File' | 'FileCode' | 'FolderPlus' | 'Terminal';
  title: string;
  message: string;
  actionText?: string;
  actionScreen?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  actionText,
  actionScreen,
  onAction,
}) => {
  const { colors } = useTheme();

  const IconComponent = () => {
    switch (icon) {
      case 'File':
        return <File size={48} color={colors.textSecondary} />;
      case 'FileCode':
        return <FileCode size={48} color={colors.textSecondary} />;
      case 'FolderPlus':
        return <FolderPlus size={48} color={colors.textSecondary} />;
      case 'Terminal':
        return <Terminal size={48} color={colors.textSecondary} />;
      default:
        return <File size={48} color={colors.textSecondary} />;
    }
  };

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (actionScreen) {
      router.navigate(`/(tabs)/${actionScreen}`);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <View style={styles.content}>
        <IconComponent />
        <Text style={[styles.title, { color: colors.text }]}>
          {title}
        </Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {message}
        </Text>
        
        {actionText && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.primary },
            ]}
            onPress={handleAction}
          >
            <Text style={styles.actionText}>
              {actionText}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 280,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
  },
  actionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#FFFFFF',
  },
});

export default EmptyState;