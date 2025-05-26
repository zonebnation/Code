import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { FolderOpen, File, ChevronLeft, X } from 'lucide-react';
import styles from './FileBrowserModal.module.css';

// Mock type definition to avoid Capacitor dependency
interface FileSystemItem {
  name: string;
  path: string;
  type: 'directory' | 'file';
}

// Mock service for file system operations
const mockFileSystemService = {
  listDirectory: async () => {
    return [
      { name: 'Documents', path: '/Documents', type: 'directory' },
      { name: 'Projects', path: '/Projects', type: 'directory' },
      { name: 'Sample Project', path: '/Sample Project', type: 'directory' },
      { name: 'sample.txt', path: '/sample.txt', type: 'file' },
    ] as FileSystemItem[];
  }
};

interface FileBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFolder: (path: string) => void;
  onSelectFile?: (path: string) => void;
  mode: 'folder' | 'file';
  title?: string;
}

const FileBrowserModal: React.FC<FileBrowserModalProps> = ({
  isOpen,
  onClose,
  onSelectFolder,
  onSelectFile,
  mode = 'folder',
  title = 'Select a Folder',
}) => {
  const { colors } = useTheme();
  const [currentPath, setCurrentPath] = useState<string>('');
  const [items, setItems] = useState<FileSystemItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pathHistory, setPathHistory] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadDirectory('');
    }
  }, [isOpen]);

  const loadDirectory = async (path: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Use mock service instead of actual Capacitor service
      const files = await mockFileSystemService.listDirectory();
      setItems(files);
      setCurrentPath(path);
    } catch (err) {
      console.error('Error loading directory:', err);
      setError('Failed to load directory contents. Please check permissions.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = async (item: FileSystemItem) => {
    if (item.type === 'directory') {
      setPathHistory(prev => [...prev, currentPath]);
      loadDirectory(item.path);
    } else if (mode === 'file' && onSelectFile) {
      onSelectFile(item.path);
      onClose();
    }
  };

  const handleGoBack = () => {
    if (pathHistory.length > 0) {
      const previousPath = pathHistory[pathHistory.length - 1];
      setPathHistory(prev => prev.slice(0, -1));
      loadDirectory(previousPath);
    }
  };

  const handleSelectCurrent = () => {
    onSelectFolder(currentPath);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div 
        className={styles.modalContent}
        style={{ 
          backgroundColor: colors.surface,
          borderColor: colors.border,
          color: colors.text
        }}
      >
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{title}</h3>
          <button 
            className={styles.closeButton}
            onClick={onClose}
          >
            <X size={20} color={colors.textSecondary} />
          </button>
        </div>
        
        <div className={styles.browserToolbar}>
          <button 
            className={styles.backButton}
            onClick={handleGoBack}
            disabled={pathHistory.length === 0}
            style={{ opacity: pathHistory.length === 0 ? 0.5 : 1 }}
          >
            <ChevronLeft size={18} color={colors.textSecondary} />
          </button>
          
          <div 
            className={styles.currentPath}
            style={{ color: colors.textSecondary }}
          >
            {currentPath || 'Documents'}
          </div>
        </div>
        
        <div className={styles.fileList}>
          {loading ? (
            <div className={styles.loadingMessage}>Loading...</div>
          ) : error ? (
            <div className={styles.errorMessage}>{error}</div>
          ) : items.length === 0 ? (
            <div className={styles.emptyMessage}>No files or folders found</div>
          ) : (
            items.map((item, index) => (
              <div
                key={index}
                className={styles.fileItem}
                onClick={() => handleItemClick(item)}
                style={{ 
                  borderBottomColor: colors.border,
                  backgroundColor: colors.surface,
                }}
              >
                <div className={styles.fileIcon}>
                  {item.type === 'directory' ? (
                    <FolderOpen size={20} color="#FFCA28" />
                  ) : (
                    <File size={20} color={colors.primary} />
                  )}
                </div>
                <div className={styles.fileDetails}>
                  <div 
                    className={styles.fileName}
                    style={{ color: colors.text }}
                  >
                    {item.name}
                  </div>
                  <div 
                    className={styles.fileType}
                    style={{ color: colors.textSecondary }}
                  >
                    {item.type === 'directory' ? 'Folder' : 'File'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {mode === 'folder' && (
          <div className={styles.actionButtons}>
            <button
              className={styles.cancelButton}
              onClick={onClose}
              style={{ 
                borderColor: colors.border,
                color: colors.text 
              }}
            >
              Cancel
            </button>
            <button
              className={styles.selectButton}
              onClick={handleSelectCurrent}
              disabled={loading}
              style={{ backgroundColor: colors.primary }}
            >
              Select This Folder
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileBrowserModal;