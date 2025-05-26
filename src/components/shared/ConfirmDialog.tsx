import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { AlertCircle } from 'lucide-react';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isDangerous = false
}) => {
  const { colors } = useTheme();
  
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
        <div className={styles.header} style={{ borderBottomColor: colors.border }}>
          <AlertCircle 
            size={20} 
            color={isDangerous ? colors.error : colors.warning} 
            className={styles.icon}
          />
          <h3 
            className={styles.title}
            style={{ color: colors.text }}
          >
            {title}
          </h3>
        </div>
        
        <div className={styles.content}>
          <p 
            className={styles.message}
            style={{ color: colors.textSecondary }}
          >
            {message}
          </p>
        </div>
        
        <div className={styles.actions} style={{ borderTopColor: colors.border }}>
          <button
            className={`${styles.button} ${styles.cancelButton}`}
            onClick={onCancel}
            style={{
              borderColor: colors.border,
              color: colors.text
            }}
          >
            {cancelLabel}
          </button>
          <button
            className={`${styles.button} ${styles.confirmButton}`}
            onClick={onConfirm}
            style={{
              backgroundColor: isDangerous ? colors.error : colors.primary,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;