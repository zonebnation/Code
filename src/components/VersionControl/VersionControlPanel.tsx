import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useProject } from '../../context/ProjectContext';
import GitPanel from './GitPanel';
import styles from './VersionControlPanel.module.css';
import { 
  GitBranch, 
  GitCommit, 
  GitPullRequest, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';

const VersionControlPanel: React.FC = () => {
  const { colors } = useTheme();
  const { currentProject } = useProject();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  if (!currentProject) return null;
  
  return (
    <div 
      className={`${styles.container} ${isCollapsed ? styles.collapsed : ''}`}
      style={{ 
        backgroundColor: colors.surface,
        borderTopColor: colors.border
      }}
    >
      <div 
        className={styles.header}
        style={{ borderBottomColor: isCollapsed ? 'transparent' : colors.border }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className={styles.headerTitle}>
          <GitBranch size={16} color={colors.primary} />
          <h3 style={{ color: colors.text }}>Version Control</h3>
        </div>
        
        <div className={styles.headerControls}>
          <button 
            className={styles.collapseButton}
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
            aria-label={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? (
              <ChevronUp size={16} color={colors.textSecondary} />
            ) : (
              <ChevronDown size={16} color={colors.textSecondary} />
            )}
          </button>
        </div>
      </div>
      
      {!isCollapsed && (
        <div className={styles.content}>
          <GitPanel />
        </div>
      )}
    </div>
  );
};

export default VersionControlPanel;