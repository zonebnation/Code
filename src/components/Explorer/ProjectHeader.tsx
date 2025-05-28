import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useProject } from '../../context/ProjectContext';
import { 
  ChevronLeft, 
  Folder, 
  FolderOpen, 
  MoreVertical, 
  LogOut, 
  Save, 
  Share,
  Globe,
  Lock,
  Users,
  X
} from 'lucide-react';
import CollaboratorsPanel from '../Collaboration/CollaboratorsPanel';
import styles from './ProjectHeader.module.css';

interface ProjectHeaderProps {
  openBrowser?: () => void;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({ openBrowser }) => {
  const { colors } = useTheme();
  const { 
    currentProject, 
    selectProject, 
    exportProject,
    togglePublic,
    syncWithServer
  } = useProject();
  
  const [showMenu, setShowMenu] = useState(false);
  const [showCollaborators, setShowCollaborators] = useState(false);

  const handleCloseProject = () => {
    if (currentProject) {
      selectProject('');
      setShowMenu(false);
    }
  };

  const handleExportProject = async () => {
    if (currentProject) {
      try {
        const exportPath = await exportProject();
        alert(`Project exported to ${exportPath}`);
      } catch (error) {
        console.error('Error exporting project:', error);
        alert('Failed to export project');
      }
    }
    setShowMenu(false);
  };
  
  const handleTogglePublic = async () => {
    if (currentProject) {
      try {
        await togglePublic();
      } catch (error) {
        console.error('Error toggling project visibility:', error);
        alert('Failed to update project visibility');
      }
    }
    setShowMenu(false);
  };

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };
  
  const toggleCollaborators = () => {
    setShowCollaborators(!showCollaborators);
    setShowMenu(false);
  };

  return (
    <>
      <div
        className={styles.container}
        style={{
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        }}
      >
        {currentProject ? (
          <>
            <div className={styles.projectInfo}>
              <Folder size={16} color={colors.primary} className={styles.folderIcon} />
              <span
                className={styles.projectName}
                style={{ color: colors.text }}
              >
                {currentProject.name}
              </span>
              {currentProject.is_public && (
                <span 
                  className={styles.publicBadge}
                  style={{ 
                    backgroundColor: `${colors.primary}20`,
                    color: colors.primary
                  }}
                >
                  <Globe size={10} />
                  <span>Public</span>
                </span>
              )}
            </div>
            
            <button
              className={styles.menuButton}
              onClick={toggleMenu}
              aria-label="Project menu"
            >
              <MoreVertical size={20} color={colors.textSecondary} />
            </button>
            
            {showMenu && (
              <div 
                className={styles.menuDropdown}
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }}
              >
                <button
                  className={styles.menuItem}
                  onClick={toggleCollaborators}
                >
                  <Users size={16} color={colors.text} className={styles.menuItemIcon} />
                  <span style={{ color: colors.text }}>Manage Collaborators</span>
                </button>
                
                <button
                  className={styles.menuItem}
                  onClick={handleTogglePublic}
                >
                  {currentProject.is_public ? (
                    <>
                      <Lock size={16} color={colors.text} className={styles.menuItemIcon} />
                      <span style={{ color: colors.text }}>Make Private</span>
                    </>
                  ) : (
                    <>
                      <Globe size={16} color={colors.text} className={styles.menuItemIcon} />
                      <span style={{ color: colors.text }}>Make Public</span>
                    </>
                  )}
                </button>
                
                <button
                  className={styles.menuItem}
                  onClick={handleCloseProject}
                >
                  <LogOut size={16} color={colors.text} className={styles.menuItemIcon} />
                  <span style={{ color: colors.text }}>Close Project</span>
                </button>
                
                <button
                  className={styles.menuItem}
                  onClick={handleExportProject}
                >
                  <Save size={16} color={colors.text} className={styles.menuItemIcon} />
                  <span style={{ color: colors.text }}>Export Project</span>
                </button>
                
                <button
                  className={styles.menuItem}
                >
                  <Share size={16} color={colors.text} className={styles.menuItemIcon} />
                  <span style={{ color: colors.text }}>Share Project</span>
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <h2 
              className={styles.title}
              style={{ color: colors.text }}
            >
              Projects
            </h2>
            
            {openBrowser && (
              <button
                className={styles.browseButton}
                onClick={openBrowser}
              >
                <FolderOpen size={18} color={colors.primary} />
              </button>
            )}
          </>
        )}
      </div>
      
      {showCollaborators && (
        <div 
          className={styles.collaboratorsPanel}
          style={{
            backgroundColor: colors.surface,
            borderBottomColor: colors.border
          }}
        >
          <div className={styles.collaboratorsHeader}>
            <h3 style={{ color: colors.text }}>Collaborators</h3>
            <button 
              className={styles.closeButton}
              onClick={toggleCollaborators}
            >
              <X size={16} color={colors.textSecondary} />
            </button>
          </div>
          <div className={styles.collaboratorsContent}>
            <CollaboratorsPanel />
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectHeader;