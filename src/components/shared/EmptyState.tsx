import { useTheme } from '../../context/ThemeContext';
import { File, FileCode, FolderPlus, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';
import styles from './EmptyState.module.css';
import { useState } from 'react';

// Mock type for compatibility - removes Capacitor dependency
type Directory = string;

interface EmptyStateProps {
  icon: 'File' | 'FileCode' | 'FolderPlus' | 'Terminal';
  title: string;
  message: string;
  actionText?: string;
  actionPath?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  actionText,
  actionPath,
  onAction,
}) => {
  const { colors } = useTheme();
  const { openProject, createNewProject } = useProject();
  const [loading, setLoading] = useState(false);

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

  const handleBrowseFiles = async () => {
    setLoading(true);
    try {
      // Since we don't have Capacitor, we'll just create a new project
      await createNewProject();
    } catch (error) {
      console.error('Error browsing files:', error);
      alert('Error accessing files. Creating a new project instead.');
      await createNewProject();
    }
    setLoading(false);
  };

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (actionText?.includes('Browse') || actionText?.includes('Open')) {
      handleBrowseFiles();
    } else if (actionText?.includes('Create')) {
      createNewProject();
    }
  };

  return (
    <div
      className={styles.container}
      style={{ backgroundColor: colors.background }}
    >
      <div className={styles.content}>
        <IconComponent />
        <h2 
          className={styles.title}
          style={{ color: colors.text }}
        >
          {title}
        </h2>
        <p 
          className={styles.message}
          style={{ color: colors.textSecondary }}
        >
          {message}
        </p>
        
        {actionText && (
          actionPath ? (
            <Link
              to={actionPath}
              className={styles.actionButton}
              style={{ backgroundColor: colors.primary }}
            >
              {actionText}
            </Link>
          ) : (
            <button
              className={styles.actionButton}
              style={{ backgroundColor: colors.primary }}
              onClick={handleAction}
              disabled={loading}
            >
              {loading ? 'Loading...' : actionText}
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default EmptyState;