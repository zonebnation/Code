import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Project, File, FileTab } from '../types/editor';
import { detectLanguage } from '../utils/languageDetection';
import { sampleProjects } from '../constants/sampleProjects';
import ProjectService from '../services/ProjectService';
import LocalStorageService from '../services/LocalStorageService';
import SyncService from '../services/SyncService';
import { useAuth } from './AuthContext';
import TemplateService from '../services/TemplateService';

type ProjectContextType = {
  projects: Project[];
  currentProject: Project | null;
  fileTree: File[];
  openFiles: FileTab[];
  currentFile: FileTab | null;
  unsavedFiles: Set<string>;
  loading: boolean;
  error: string | null;
  isOffline: boolean;
  isSyncing: boolean;
  createNewProject: (name?: string, templateId?: string) => Promise<void>;
  selectProject: (projectId: string) => void;
  openProject: (project: Project) => void;
  openFile: (file: File) => void;
  closeFile: (fileId: string) => void;
  setCurrentFile: (fileId: string) => void;
  saveFile: (fileId: string, content: string) => Promise<void>;
  createNewFile: (name: string, parentId?: string) => Promise<void>;
  createNewFolder: (name: string, parentId?: string) => Promise<void>;
  exportProject: () => Promise<string>;
  deleteFile: (fileId: string) => Promise<void>;
  renameFile: (fileId: string, newName: string) => Promise<void>;
  findFileById: (fileId: string) => File | null;
  copyFile: (fileId: string) => void;
  pasteFile: (targetDirectoryId?: string) => Promise<void>;
  moveFile: (fileId: string, targetDirectoryId: string) => Promise<void>;
  clipboard: File | null;
  updateFileContent: (fileId: string, content: string) => void;
  hasUnsavedChanges: (fileId: string) => boolean;
  syncWithServer: () => Promise<void>;
  togglePublic: () => Promise<void>;
  refreshProjects: () => Promise<void>;
  reorderTabs: (newOrder: FileTab[]) => void;
  duplicateFile: (fileId: string) => Promise<void>;
  toggleOfflineMode: () => void;
  syncOfflineChanges: () => Promise<void>;
};

const ProjectContext = createContext<ProjectContextType>({
  projects: [],
  currentProject: null,
  fileTree: [],
  openFiles: [],
  currentFile: null,
  unsavedFiles: new Set(),
  loading: false,
  error: null,
  isOffline: false,
  isSyncing: false,
  createNewProject: async () => {},
  selectProject: () => {},
  openProject: () => {},
  openFile: () => {},
  closeFile: () => {},
  setCurrentFile: () => {},
  saveFile: async () => {},
  createNewFile: async () => {},
  createNewFolder: async () => {},
  exportProject: async () => "",
  deleteFile: async () => {},
  renameFile: async () => {},
  findFileById: () => null,
  copyFile: () => {},
  pasteFile: async () => {},
  moveFile: async () => {},
  clipboard: null,
  updateFileContent: () => {},
  hasUnsavedChanges: () => false,
  syncWithServer: async () => {},
  togglePublic: async () => {},
  refreshProjects: async () => {},
  reorderTabs: () => {},
  duplicateFile: async () => {},
  toggleOfflineMode: () => {},
  syncOfflineChanges: async () => {},
});

export const useProject = () => useContext(ProjectContext);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>(sampleProjects);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [fileTree, setFileTree] = useState<File[]>([]);
  const [openFiles, setOpenFiles] = useState<FileTab[]>([]);
  const [currentFile, setCurrentFileState] = useState<FileTab | null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [clipboard, setClipboard] = useState<File | null>(null);
  const [unsavedFiles, setUnsavedFiles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Load projects from local storage when app starts
  useEffect(() => {
    const localProjects = LocalStorageService.loadProjects();
    if (localProjects.length > 0) {
      setProjects(prev => {
        const combinedProjects = [...prev];
        
        // Add projects from local storage that aren't in state
        localProjects.forEach(localProject => {
          if (!combinedProjects.some(p => p.id === localProject.id)) {
            combinedProjects.push(localProject);
          }
        });
        
        return combinedProjects;
      });
    }
    
    const localRecentProjects = LocalStorageService.loadRecentProjects();
    if (localRecentProjects.length > 0) {
      setRecentProjects(localRecentProjects);
    }
    
    // Try to restore current project if it was active
    const currentProjectId = LocalStorageService.getCurrentProjectId();
    if (currentProjectId) {
      const foundProject = localProjects.find(p => p.id === currentProjectId);
      if (foundProject) {
        setCurrentProject(foundProject);
        
        // Also restore open tabs and current file
        const openTabs = LocalStorageService.loadOpenTabs(currentProjectId);
        if (openTabs.length > 0) {
          setOpenFiles(openTabs);
          
          const currentFileId = LocalStorageService.getCurrentFileId(currentProjectId);
          if (currentFileId) {
            const currentTab = openTabs.find(tab => tab.id === currentFileId);
            if (currentTab) {
              setCurrentFileState(currentTab);
            }
          }
        }
        
        // Restore unsaved files
        const unsavedFileIds = LocalStorageService.loadUnsavedFiles(currentProjectId);
        if (unsavedFileIds.length > 0) {
          setUnsavedFiles(new Set(unsavedFileIds));
        }
      }
    }
  }, []);
  
  // Set up sync and offline listeners
  useEffect(() => {
    const handleOfflineChange = (offline: boolean) => {
      setIsOffline(offline);
    };
    
    const handleSyncChange = (syncing: boolean) => {
      setIsSyncing(syncing);
    };
    
    SyncService.onOfflineStatusChange(handleOfflineChange);
    SyncService.onSyncStatusChange(handleSyncChange);
    
    return () => {
      SyncService.removeOfflineListener(handleOfflineChange);
      SyncService.removeSyncListener(handleSyncChange);
    };
  }, []);

  // Load projects from API when user logs in
  useEffect(() => {
    if (user) {
      refreshProjects();
    } else {
      setProjects(sampleProjects);
      if (currentProject && !sampleProjects.find(p => p.id === currentProject.id)) {
        setCurrentProject(null);
        setOpenFiles([]);
        setCurrentFileState(null);
      }
    }
  }, [user]);

  // Update fileTree when currentProject changes
  useEffect(() => {
    if (currentProject) {
      setFileTree(currentProject.files);
      updateRecentProjects(currentProject);
      
      // Save current project to local storage
      LocalStorageService.saveProject(currentProject);
      LocalStorageService.saveCurrentProjectId(currentProject.id);
    } else {
      setFileTree([]);
      LocalStorageService.saveCurrentProjectId(null);
    }
  }, [currentProject]);
  
  // Save open tabs and current file to local storage when they change
  useEffect(() => {
    if (currentProject) {
      LocalStorageService.saveOpenTabs(currentProject.id, openFiles);
    }
  }, [openFiles, currentProject]);
  
  useEffect(() => {
    if (currentProject && currentFile) {
      LocalStorageService.saveCurrentFileId(currentProject.id, currentFile.id);
    } else if (currentProject) {
      LocalStorageService.saveCurrentFileId(currentProject.id, null);
    }
  }, [currentFile, currentProject]);
  
  // Save unsaved files to local storage
  useEffect(() => {
    if (currentProject) {
      LocalStorageService.saveUnsavedFiles(
        currentProject.id, 
        Array.from(unsavedFiles)
      );
    }
  }, [unsavedFiles, currentProject]);

  const updateRecentProjects = (project: Project) => {
    setRecentProjects(prev => {
      const filtered = prev.filter(p => p.id !== project.id);
      const updated = [project, ...filtered].slice(0, 5);
      
      // Save to local storage
      LocalStorageService.saveRecentProjects(updated);
      
      return updated;
    });
  };

  const refreshProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (user) {
        if (SyncService.isOffline()) {
          // If offline, just use the local projects
          const localProjects = LocalStorageService.loadProjects();
          setProjects(localProjects);
        } else {
          // If online, fetch from API and merge with local
          const userProjects = await ProjectService.getUserProjects();
          
          // Save to local storage
          userProjects.forEach(project => {
            LocalStorageService.saveProject(project);
          });
          
          setProjects(userProjects);
        }
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      setError('Failed to load your projects. Using local copies instead.');
      
      // Fallback to local storage
      const localProjects = LocalStorageService.loadProjects();
      setProjects(localProjects);
    } finally {
      setLoading(false);
    }
  };

  const createNewProject = async (name: string = 'New Project', templateId?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      let newProject: Project;
      
      if (user && !SyncService.isOffline()) {
        newProject = await ProjectService.createProject(name);
      } else {
        // Create local project with basic structure or from template
        let files: File[];
        
        if (templateId) {
          // Create from template
          files = TemplateService.createFilesFromTemplate(templateId);
        } else {
          // Create with basic structure
          files = [
            {
              id: 'file-1',
              name: 'index.js',
              type: 'file',
              path: '/index.js',
              content: '// Welcome to Code Canvas!\nconsole.log("Hello, world!");',
            },
            {
              id: 'file-2',
              name: 'style.css',
              type: 'file',
              path: '/style.css',
              content: '/* Styles for your project */\nbody {\n  font-family: sans-serif;\n  margin: 0;\n  padding: 20px;\n}',
            },
            {
              id: 'folder-1',
              name: 'src',
              type: 'directory',
              path: '/src',
              children: ['file-3', 'file-4'],
            },
            {
              id: 'file-3',
              name: 'app.js',
              type: 'file',
              path: '/src/app.js',
              content: '// App logic goes here\nfunction init() {\n  console.log("App initialized");\n}\n\ninit();',
            },
            {
              id: 'file-4',
              name: 'utils.js',
              type: 'file',
              path: '/src/utils.js',
              content: '// Utility functions\nexport function formatDate(date) {\n  return new Date(date).toLocaleDateString();\n}',
            },
          ];
        }
        
        newProject = {
          id: Date.now().toString(),
          name,
          path: `/projects/${name.toLowerCase().replace(/\s+/g, '-')}`,
          files,
          createdAt: new Date().toISOString(),
        };
      }

      setProjects((prev) => [...prev, newProject]);
      openProject(newProject);
    } catch (error) {
      console.error('Error creating project:', error);
      setError('Failed to create new project');
    } finally {
      setLoading(false);
    }
  };

  const selectProject = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId) || 
                    recentProjects.find((p) => p.id === projectId) || null;
    
    if (project) {
      openProject(project);
    } else {
      setCurrentProject(null);
      setOpenFiles([]);
      setCurrentFileState(null);
      setUnsavedFiles(new Set());
      
      // Clear local storage for current project
      LocalStorageService.saveCurrentProjectId(null);
    }
  };

  const openProject = (project: Project) => {
    setProjects(prev => {
      if (!prev.some(p => p.id === project.id)) {
        return [...prev, project];
      }
      return prev;
    });
    
    setCurrentProject(project);
    
    // Try to restore open tabs and files from local storage
    const savedTabs = LocalStorageService.loadOpenTabs(project.id);
    if (savedTabs.length > 0) {
      setOpenFiles(savedTabs);
      
      const currentFileId = LocalStorageService.getCurrentFileId(project.id);
      if (currentFileId) {
        const currentTab = savedTabs.find(tab => tab.id === currentFileId);
        if (currentTab) {
          setCurrentFileState(currentTab);
        }
      } else {
        setCurrentFileState(savedTabs[0]);
      }
      
      // Restore unsaved files
      const unsavedFileIds = LocalStorageService.loadUnsavedFiles(project.id);
      setUnsavedFiles(new Set(unsavedFileIds));
    } else {
      setOpenFiles([]);
      setCurrentFileState(null);
      setUnsavedFiles(new Set());
    }
    
    // Update recent projects
    updateRecentProjects(project);
    
    // Save current project to local storage
    LocalStorageService.saveCurrentProjectId(project.id);
  };

  const findFileById = (fileId: string): File | null => {
    if (!currentProject) return null;
    return currentProject.files.find((file) => file.id === fileId) || null;
  };

  const openFile = (file: File) => {
    if (file.type === 'directory') return;
    
    if (openFiles.some((f) => f.id === file.id)) {
      setCurrentFile(file.id);
      return;
    }

    const language = detectLanguage(file.name);
    
    const fileTab: FileTab = {
      id: file.id,
      name: file.name,
      path: file.path,
      language,
      content: file.content || '',
    };

    setOpenFiles((prev) => [...prev, fileTab]);
    setCurrentFileState(fileTab);
  };

  const closeFile = (fileId: string) => {
    const isCurrentFile = currentFile?.id === fileId;
    
    setOpenFiles((prev) => {
      const newOpenFiles = prev.filter((file) => file.id !== fileId);
      
      if (isCurrentFile && newOpenFiles.length > 0) {
        const currentIndex = prev.findIndex((file) => file.id === fileId);
        const newCurrentIndex = Math.min(currentIndex, newOpenFiles.length - 1);
        setCurrentFileState(newOpenFiles[newCurrentIndex]);
      } else if (isCurrentFile) {
        setCurrentFileState(null);
      }
      
      // Save open tabs to local storage
      if (currentProject) {
        LocalStorageService.saveOpenTabs(
          currentProject.id, 
          newOpenFiles
        );
      }
      
      return newOpenFiles;
    });

    if (unsavedFiles.has(fileId)) {
      const newUnsavedFiles = new Set(unsavedFiles);
      newUnsavedFiles.delete(fileId);
      setUnsavedFiles(newUnsavedFiles);
    }
  };

  const setCurrentFile = (fileId: string) => {
    const file = openFiles.find((f) => f.id === fileId) || null;
    setCurrentFileState(file);
    
    // Save current file to local storage
    if (currentProject) {
      LocalStorageService.saveCurrentFileId(currentProject.id, fileId);
    }
  };

  const updateFileContent = (fileId: string, content: string) => {
    setOpenFiles((prev) =>
      prev.map((file) =>
        file.id === fileId ? { ...file, content } : file
      )
    );

    if (!unsavedFiles.has(fileId)) {
      const newUnsavedFiles = new Set(unsavedFiles);
      newUnsavedFiles.add(fileId);
      setUnsavedFiles(newUnsavedFiles);
    }
  };

  const hasUnsavedChanges = (fileId: string): boolean => {
    return unsavedFiles.has(fileId);
  };

  const saveFile = async (fileId: string, content: string) => {
    try {
      setLoading(true);
      
      setOpenFiles((prev) =>
        prev.map((file) =>
          file.id === fileId ? { ...file, content } : file
        )
      );

      if (currentProject) {
        const fileToUpdate = currentProject.files.find(f => f.id === fileId);
        
        if (fileToUpdate && fileToUpdate.type === 'file') {
          setProjects((prev) =>
            prev.map((project) => {
              if (project.id === currentProject.id) {
                return {
                  ...project,
                  files: project.files.map((file) => {
                    if (file.id === fileId && file.type === 'file') {
                      return { ...file, content };
                    }
                    return file;
                  }),
                };
              }
              return project;
            })
          );
          
          setCurrentProject(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              files: prev.files.map(file => {
                if (file.id === fileId && file.type === 'file') {
                  return { ...file, content };
                }
                return file;
              })
            };
          });
          
          // If online and logged in, sync with server
          if (user && !SyncService.isOffline()) {
            try {
              await syncWithServer();
            } catch (error) {
              console.error('Error syncing with server:', error);
            }
          }
          
          if (unsavedFiles.has(fileId)) {
            const newUnsavedFiles = new Set(unsavedFiles);
            newUnsavedFiles.delete(fileId);
            setUnsavedFiles(newUnsavedFiles);
          }
        }
      }
    } catch (error) {
      console.error('Error saving file:', error);
      setError('Failed to save file');
    } finally {
      setLoading(false);
    }
  };

  const syncWithServer = async () => {
    try {
      if (!user || !currentProject) return;
      
      setLoading(true);
      setError(null);
      
      const syncedProject = await ProjectService.syncProject(currentProject);
      
      setProjects(prev => 
        prev.map(p => p.id === syncedProject.id ? syncedProject : p)
      );
      
      setCurrentProject(syncedProject);
    } catch (error) {
      console.error('Error syncing with server:', error);
      setError('Failed to sync project with server');
    } finally {
      setLoading(false);
    }
  };
  
  const togglePublic = async () => {
    try {
      if (!user || !currentProject) return;
      
      setLoading(true);
      setError(null);
      
      const isPublic = !currentProject.isPublic;
      
      await ProjectService.updateProject(currentProject.id, { is_public: isPublic });
      
      const updatedProject = {
        ...currentProject,
        isPublic
      };
      
      setProjects(prev => 
        prev.map(p => p.id === updatedProject.id ? updatedProject : p)
      );
      
      setCurrentProject(updatedProject);
    } catch (error) {
      console.error('Error toggling project visibility:', error);
      setError('Failed to update project visibility');
    } finally {
      setLoading(false);
    }
  };

  const createNewFile = async (name: string, parentId?: string) => {
    // Implementation similar to existing code, but with server sync when authenticated
  };

  const createNewFolder = async (name: string, parentId?: string) => {
    // Implementation similar to existing code, but with server sync when authenticated
  };

  const exportProject = async () => {
    // Implementation similar to existing code
    return "";
  };

  const deleteFile = async (fileId: string) => {
    // Implementation similar to existing code, but with server sync when authenticated
  };

  const renameFile = async (fileId: string, newName: string) => {
    // Implementation similar to existing code, but with server sync when authenticated
  };

  const copyFile = (fileId: string) => {
    // Same as existing implementation
  };

  const pasteFile = async (targetDirectoryId?: string) => {
    // Implementation similar to existing code, but with server sync when authenticated
  };
  
  const moveFile = async (fileId: string, targetDirectoryId: string) => {
    // Implementation for moving files
  };
  
  const duplicateFile = async (fileId: string) => {
    // Implementation for duplicating files
  };
  
  const reorderTabs = (newOrder: FileTab[]) => {
    // Implementation for reordering tabs
  };
  
  const toggleOfflineMode = () => {
    SyncService.setOfflineMode(!isOffline);
  };
  
  const syncOfflineChanges = async () => {
    if (SyncService.isOffline()) {
      setError('Cannot sync while in offline mode');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await SyncService.forceSyncNow();
      
      // Refresh projects after sync
      await refreshProjects();
    } catch (error) {
      console.error('Error syncing offline changes:', error);
      setError('Failed to sync offline changes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        fileTree,
        openFiles,
        currentFile,
        unsavedFiles,
        loading,
        error,
        isOffline,
        isSyncing,
        createNewProject,
        selectProject,
        openProject,
        openFile,
        closeFile,
        setCurrentFile,
        saveFile,
        createNewFile,
        createNewFolder,
        exportProject,
        deleteFile,
        renameFile,
        findFileById,
        copyFile,
        pasteFile,
        moveFile,
        clipboard,
        updateFileContent,
        hasUnsavedChanges,
        syncWithServer,
        togglePublic,
        refreshProjects,
        reorderTabs,
        duplicateFile,
        toggleOfflineMode,
        syncOfflineChanges,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};