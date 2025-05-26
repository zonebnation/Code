import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Edit } from 'lucide-react';
import styles from './RenameDialog.module.css';

interface RenameDialogProps {
  isOpen: boolean;
  currentName: string;
  onRename: (newName: string) => Promise<void>;
  onCancel: () => void;
}

const RenameDialog: React.FC<RenameDialogProps> = ({
  isOpen,
  currentName,
  onRename,
  onCancel
}) => {
  const { colors } = useTheme();
  const [newName, setNewName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Reset state when dialog opens/changes
  useEffect(() => {
    if (isOpen) {
      setNewName(currentName);
      setError(null);
      setIsSubmitting(false);
      
      // Focus input and select name (without extension if present)
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          
          const lastDotIndex = currentName.lastIndexOf('.');
          if (lastDotIndex > 0) {
            inputRef.current.setSelectionRange(0, lastDotIndex);
          } else {
            inputRef.current.select();
          }
        }
      }, 100);
    }
  }, [isOpen, currentName]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newName.trim()) {
      setError('Name cannot be empty');
      return;
    }
    
    if (newName === currentName) {
      onCancel();
      return;
    }
    
    // Validate file name
    if (newName.includes('/') || newName.includes('\\')) {
      setError('Name cannot contain / or \\ characters');
      return;
    }
    
    setError(null);
    setIsSubmitting(true);
    
    try {
      await onRename(newName);
    } catch (err: any) {
      setError(err.message || 'Failed to rename');
      setIsSubmitting(false);
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
          <Edit size={18} color={colors.primary} className={styles.icon} />
          <h3 
            className={styles.title}
            style={{ color: colors.text }}
          >
            Rename
          </h3>
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
          <div className={styles.inputContainer}>
            <label 
              htmlFor="rename-input" 
              className={styles.label}
              style={{ color: colors.textSecondary }}
            >
              New name:
            </label>
            <input
              id="rename-input"
              ref={inputRef}
              type="text"
              className={styles.input}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
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
              onClick={onCancel}
              disabled={isSubmitting}
              style={{
                borderColor: colors.border,
                color: colors.text
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.renameButton}
              disabled={isSubmitting || !newName.trim() || newName === currentName}
              style={{
                backgroundColor: colors.primary,
                opacity: (isSubmitting || !newName.trim() || newName === currentName) ? 0.7 : 1
              }}
            >
              {isSubmitting ? 'Renaming...' : 'Rename'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RenameDialog;