import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { X, FileText, Folder } from 'lucide-react';
import styles from './NewFileDialog.module.css';

export type FileType = 'file' | 'folder';

interface NewFileDialogProps {
  isOpen: boolean;
  fileType: FileType;
  parentPath?: string;
  onClose: () => void;
  onCreateFile: (name: string, type: FileType, parentPath?: string) => Promise<void>;
}

const NewFileDialog: React.FC<NewFileDialogProps> = ({
  isOpen,
  fileType,
  parentPath,
  onClose,
  onCreateFile
}) => {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  
  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError(`Please enter a ${fileType} name`);
      return;
    }
    
    // Validate file name
    if (name.includes('/') || name.includes('\\')) {
      setError('Name cannot contain / or \\ characters');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await onCreateFile(name, fileType, parentPath);
      onClose();
    } catch (error: any) {
      setError(error.message || `Failed to create ${fileType}`);
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className={styles.overlay}>
      <div 
        className={styles.dialog}
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border
        }}
      >
        <div className={styles.header}>
          <h3 
            className={styles.title}
            style={{ color: colors.text }}
          >
            New {fileType === 'file' ? 'File' : 'Folder'}
          </h3>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} color={colors.textSecondary} />
          </button>
        </div>
        
        {error && (
          <div 
            className={styles.errorBox}
            style={{ 
              backgroundColor: `${colors.error}15`,
              color: colors.error
            }}
          >
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className={styles.fileTypeIcon}>
            {fileType === 'file' ? (
              <FileText size={32} color={colors.primary} />
            ) : (
              <Folder size={32} color="#FFCA28" />
            )}
          </div>
          
          {parentPath && (
            <div 
              className={styles.parentPath}
              style={{ color: colors.textSecondary }}
            >
              Location: {parentPath || 'root'}
            </div>
          )}
          
          <div className={styles.inputContainer}>
            <input
              ref={inputRef}
              type="text"
              className={styles.input}
              placeholder={fileType === 'file' ? 'Enter file name' : 'Enter folder name'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                borderColor: colors.border,
                backgroundColor: colors.background,
                color: colors.text
              }}
            />
          </div>
          
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={loading}
              style={{
                borderColor: colors.border,
                color: colors.text
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.createButton}
              disabled={loading || !name.trim()}
              style={{
                backgroundColor: colors.primary,
                opacity: loading || !name.trim() ? 0.7 : 1
              }}
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewFileDialog;