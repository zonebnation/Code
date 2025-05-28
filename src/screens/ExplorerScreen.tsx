import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useProject } from '../context/ProjectContext';
import ProjectHeader from '../components/Explorer/ProjectHeader';
import FileTree from '../components/Explorer/FileTree';
import EnhancedFileTree from '../components/FileExplorer/EnhancedFileTree';
import ProjectActions from '../components/Explorer/ProjectActions';
import EmptyState from '../components/shared/EmptyState';
import FileBrowserModal from '../components/FileBrowser/FileBrowserModal';
import NewFileDialog, { FileType } from '../components/Explorer/NewFileDialog';
import NewProjectModal from '../components/Explorer/NewProjectModal';
import { FileText, Folder, Plus } from 'lucide-react';
import keyBindingsService from '../services/KeyBindingsService';
import styles from './ExplorerScreen.module.css';
import { useNavigate } from 'react-router-dom';

const ExplorerScreen = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const { 
    projects, 
    currentProject, 
    selectProject, 
    createNewProject,
    createNewFile,
    createNewFolder,
    openProject
  } = useProject();
  
  const [fileBrowserOpen, setFileBrowserOpen] = useState(false);
  const [newFileDialogOpen, setNewFileDialogOpen] = useState(false);
  const [newFileType, setNewFileType] = useState<FileType>('file');
  const [newFileParentId, setNewFileParentId] = useState<string | undefined>(undefined);
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [useEnhancedFileTree, setUseEnhancedFileTree] = useState(true);

  // Register keybindings for explorer
  useEffect(() => {
    // Set explorer scope for keybindings
    keyBindingsService.setScope('explorer');
    
    // Register handlers
    const newFileUnregister = keyBindingsService.registerHandler('explorer.newFile', handleNewFile);
    const newFolderUnregister = keyBindingsService.registerHandler('explorer.newFolder', handleNewFolder);
    
    return () => {
      newFileUnregister();
      newFolderUnregister();
    };
  }, []);

  const handleOpenProject = async (folderPath: string) => {
    try {
      // Create a simple project since we don't have filesystem access
      const projectName = folderPath.split('/').pop() || 'New Project';
      await createNewProject(projectName);
    } catch (error) {
      console.error('Error opening project:', error);
      alert('Failed to open project. Creating a new one instead.');
      await createNewProject();
    }
  };
  
  const handleNewFile = () => {
    setNewFileType('file');
    setNewFileDialogOpen(true);
  };
  
  const handleNewFolder = () => {
    setNewFileType('folder');
    setNewFileDialogOpen(true);
  };
  
  const handleCreateFile = async (name: string, type: FileType) => {
    try {
      if (type === 'file') {
        await createNewFile(name);
      } else {
        await createNewFolder(name);
      }
    } catch (error) {
      console.error(`Error creating ${type}:`, error);
      throw error;
    }
  };

  const handleCreateProject = async (name: string, templateId?: string) => {
    try {
      await createNewProject(name, templateId);
    } catch (error) {
      console.error('Error creating project:', error);
      throw new Error(`Failed to create project: ${error}`);
    }
  };

  const handleQuickCreateFile = async () => {
    try {
      // Create a new file named "index.js" if no project exists, otherwise create "newfile.js"
      const fileName = currentProject ? "newfile.js" : "index.js";
      
      // If no project exists, create one first
      if (!currentProject) {
        await createNewProject("My Project");
      }
      
      // Create the file
      await createNewFile(fileName);
      
      // Navigate to editor
      navigate('/editor');
    } catch (error) {
      console.error('Error creating file:', error);
      alert('Failed to create file. Please try again.');
    }
  };

  // Combine projects for display
  const combinedProjects = [...projects];

  if (!currentProject && combinedProjects.length === 0) {
    return (
      <div className="welcome-screen" style={{ 
        backgroundColor: colors.background,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{ 
          backgroundColor: colors.surface,
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ color: colors.text, marginBottom: '16px', fontSize: '24px' }}>
            Welcome to Code Canvas!
          </h1>
          
          <p style={{ color: colors.textSecondary, marginBottom: '32px', fontSize: '16px' }}>
            Start coding right away or create a new project to organize your work
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <button
              onClick={handleQuickCreateFile}
              style={{
                backgroundColor: colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '16px',
                fontSize: '16px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s, background-color 0.2s'
              }}
            >
              <Plus size={20} />
              Start Coding Now
            </button>
            
            <button
              onClick={() => setNewProjectModalOpen(true)}
              style={{
                backgroundColor: colors.surface,
                color: colors.text,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                padding: '16px',
                fontSize: '16px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                cursor: 'pointer'
              }}
            >
              <Folder size={20} />
              Create New Project
            </button>
          </div>
          
          <p style={{ color: colors.textSecondary, marginTop: '32px', fontSize: '14px' }}>
            Your work automatically saves as you type
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={styles.container}
      style={{ backgroundColor: colors.background }}
    >
      <ProjectHeader openBrowser={() => setFileBrowserOpen(true)} />
      
      {!currentProject ? (
        <div className={styles.projectList}>
          <h3 
            className={styles.listHeader}
            style={{ color: colors.textSecondary }}
          >
            Recent Projects
          </h3>
          
          {combinedProjects.map(item => (
            <div 
              key={item.id}
              className={styles.projectItem}
              style={{ borderBottomColor: colors.border }}
              onClick={() => selectProject(item.id)}
            >
              <h4 
                className={styles.projectName}
                style={{ color: colors.text }}
              >
                {item.name}
              </h4>
              <p 
                className={styles.projectPath}
                style={{ color: colors.textSecondary }}
              >
                {item.path}
              </p>
            </div>
          ))}
          
          <div className={styles.projectActions}>
            <button
              className={styles.browseButton}
              style={{ backgroundColor: colors.primary }}
              onClick={() => setFileBrowserOpen(true)}
            >
              Browse Projects
            </button>
            <button
              className={styles.createButton}
              style={{ 
                backgroundColor: 'transparent', 
                borderColor: colors.border,
                color: colors.text
              }}
              onClick={() => setNewProjectModalOpen(true)}
            >
              Create New Project
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.fileTreeContainer}>
          <div className={styles.fileActionsBar}>
            <div className={styles.fileActionsTitle} style={{ color: colors.text }}>
              Files
            </div>
            <div className={styles.fileActions}>
              <button 
                className={styles.fileAction}
                onClick={handleNewFile}
                title="New File (Alt+N)"
              >
                <FileText size={16} color={colors.textSecondary} />
              </button>
              <button 
                className={styles.fileAction}
                onClick={handleNewFolder}
                title="New Folder (Alt+Shift+N)"
              >
                <Folder size={16} color={colors.textSecondary} />
              </button>
              <button
                className={styles.fileAction}
                onClick={() => setUseEnhancedFileTree(!useEnhancedFileTree)}
                title={useEnhancedFileTree ? "Switch to simple view" : "Switch to enhanced view"}
                style={{ 
                  backgroundColor: useEnhancedFileTree ? `${colors.primary}20` : 'transparent',
                }}
              >
                <span style={{ 
                  fontSize: '10px', 
                  fontWeight: 'bold',
                  color: useEnhancedFileTree ? colors.primary : colors.textSecondary
                }}>
                  {useEnhancedFileTree ? "Enhanced" : "Simple"}
                </span>
              </button>
            </div>
          </div>
          
          {useEnhancedFileTree ? <EnhancedFileTree /> : <FileTree />}
        </div>
      )}
      
      <ProjectActions />
      
      <FileBrowserModal
        isOpen={fileBrowserOpen}
        onClose={() => setFileBrowserOpen(false)}
        onSelectFolder={handleOpenProject}
        mode="folder"
        title="Select Project Folder"
      />
      
      <NewFileDialog
        isOpen={newFileDialogOpen}
        fileType={newFileType}
        parentPath={newFileParentId}
        onClose={() => setNewFileDialogOpen(false)}
        onCreateFile={handleCreateFile}
      />
      
      <NewProjectModal
        isOpen={newProjectModalOpen}
        onClose={() => setNewProjectModalOpen(false)}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
};

export default ExplorerScreen;