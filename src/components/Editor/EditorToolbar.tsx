import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useProject } from '../../context/ProjectContext';
import { 
  Save, 
  Share2, 
  Settings, 
  Code, 
  Type, 
  ToggleLeft as Toggle, 
  Bug, 
  MoreVertical,
  Users,
  MessageSquare,
  AlignLeft, // Adding the format icon
  Download,
  Zap
} from 'lucide-react';
import ShareButton from '../Sharing/ShareButton';
import styles from './EditorToolbar.module.css';

interface EditorToolbarProps {
  onSave?: () => void;
  onToggleEditor?: () => void;
  onToggleDebugger?: () => void;
  isDebuggerActive?: boolean;
  onToggleChat?: () => void;
  isChatActive?: boolean;
  isCollaborative?: boolean;
  onFormat?: () => void;
  onToggleAI?: () => void;
  isAIActive?: boolean;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ 
  onSave, 
  onToggleEditor, 
  onToggleDebugger, 
  isDebuggerActive = false,
  onToggleChat,
  isChatActive = false,
  isCollaborative = false,
  onFormat,
  onToggleAI,
  isAIActive = true
}) => {
  const { colors } = useTheme();
  const { currentProject, currentFile, hasUnsavedChanges, saveFile } = useProject();
  
  const isUnsaved = currentFile ? hasUnsavedChanges(currentFile.id) : false;

  const handleSave = () => {
    if (onSave) {
      onSave();
    } else if (currentFile) {
      saveFile(currentFile.id, currentFile.content);
    }
  };

  const handleExportFile = async () => {
    if (!currentFile) return;
    
    // Create a blob with the file content
    const blob = new Blob([currentFile.content], { type: 'text/plain' });
    
    // Create a download link and trigger the download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.name;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      className={styles.container}
      style={{ 
        backgroundColor: colors.surface,
        borderBottomColor: colors.border,
      }}
    >
      <div className={styles.fileInfo}>
        {currentFile && (
          <span 
            className={styles.filePath}
            style={{ color: colors.textSecondary }}
          >
            {currentFile.path}
            {isUnsaved && (
              <span style={{ color: colors.primary }}> • unsaved</span>
            )}
          </span>
        )}
      </div>
      
      <div className={styles.actions}>
        <button 
          className={styles.actionButton}
          title="Font Settings"
        >
          <Type size={18} color={colors.textSecondary} />
        </button>
        
        {onToggleAI && (
          <button
            className={styles.actionButton}
            title={isAIActive ? "Disable AI Suggestions" : "Enable AI Suggestions"}
            onClick={onToggleAI}
            style={{
              backgroundColor: isAIActive ? `${colors.primary}20` : 'transparent',
              borderColor: isAIActive ? colors.primary : 'transparent',
              borderWidth: '1px',
              borderStyle: 'solid'
            }}
          >
            <Zap
              size={18}
              color={isAIActive ? colors.primary : colors.textSecondary}
            />
          </button>
        )}
        
        {/* Add Format Button */}
        <button 
          className={styles.actionButton}
          title="Format Document (Alt+Shift+F)"
          onClick={onFormat}
        >
          <AlignLeft size={18} color={colors.textSecondary} />
        </button>
        
        <button 
          className={styles.actionButton}
          title="Toggle Debugger"
          onClick={onToggleDebugger}
          style={{ 
            backgroundColor: isDebuggerActive ? `${colors.primary}20` : 'transparent',
            borderColor: isDebuggerActive ? colors.primary : 'transparent',
            borderWidth: '1px',
            borderStyle: 'solid'
          }}
        >
          <Bug size={18} color={isDebuggerActive ? colors.primary : colors.textSecondary} />
        </button>
        
        <button 
          className={styles.actionButton}
          onClick={onToggleEditor}
          title="Toggle Editor"
        >
          <Toggle size={18} color={colors.textSecondary} />
        </button>
        
        {isCollaborative && onToggleChat && (
          <button 
            className={styles.actionButton}
            onClick={onToggleChat}
            title="Toggle Chat"
            style={{ 
              backgroundColor: isChatActive ? `${colors.primary}20` : 'transparent',
              borderColor: isChatActive ? colors.primary : 'transparent',
              borderWidth: '1px',
              borderStyle: 'solid'
            }}
          >
            <MessageSquare 
              size={18} 
              color={isChatActive ? colors.primary : colors.textSecondary} 
            />
          </button>
        )}
        
        <button 
          className={styles.actionButton}
          onClick={handleSave}
          title="Save (Ctrl+S)"
        >
          <Save size={18} color={isUnsaved ? colors.primary : colors.textSecondary} />
        </button>
        
        <button 
          className={styles.actionButton}
          onClick={handleExportFile}
          title="Export File"
        >
          <Download size={18} color={colors.textSecondary} />
        </button>

        {currentFile && (
          <ShareButton 
            // Pass the file as a simple FileTab to prevent type errors
            // ShareButton accepts either Project or File
            file={{
              id: currentFile.id,
              name: currentFile.name,
              path: currentFile.path,
              type: 'file',
              content: currentFile.content
            }}
            size={18}
            className={styles.actionButton}
          />
        )}
        
        <button 
          className={styles.actionButton}
          title="More options"
        >
          <MoreVertical size={18} color={colors.textSecondary} />
        </button>
      </div>
    </div>
  );
};

export default EditorToolbar;