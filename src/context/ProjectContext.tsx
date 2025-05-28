import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Project, File, FileTab } from '../types/editor';
import { detectLanguage } from '../utils/languageDetection';
import { sampleProjects } from '../constants/sampleProjects';
import ProjectService from '../services/ProjectService';
import { useAuth } from './AuthContext';

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
  createNewFile: (name: string, parentId?: string) => Promise<File>;
  createNewFolder: (name: string, parentId?: string) => Promise<File>;
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
  duplicateFile: (fileId: string) => Promise<File>;
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
  createNewFile: async () => ({ id: '', name: '', type: 'file', path: '' }),
  createNewFolder: async () => ({ id: '', name: '', type: 'directory', path: '' }),
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
  duplicateFile: async () => ({ id: '', name: '', type: 'file', path: '' }),
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
          user_id: 'mock-user-id',
          is_public: false
        };
        
        // Save project to local storage
        LocalStorageService.saveProject(newProject);
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
          
          // Save to local storage
          LocalStorageService.saveProject(currentProject);
          
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
      
      const isPublic = !currentProject.is_public;
      
      await ProjectService.updateProject(currentProject.id, { is_public: isPublic });
      
      const updatedProject = {
        ...currentProject,
        is_public: isPublic
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

  const createNewFile = async (name: string, parentId?: string): Promise<File> => {
    if (!currentProject) {
      throw new Error("No project is currently open");
    }
    
    try {
      setLoading(true);
      
      // Generate a unique ID for the new file
      const newId = uuidv4();
      
      // Determine the path for the new file
      let path: string;
      
      if (parentId) {
        // Find parent directory
        const parentFile = currentProject.files.find(file => file.id === parentId);
        if (!parentFile || parentFile.type !== 'directory') {
          throw new Error("Invalid parent directory");
        }
        
        path = `${parentFile.path}/${name}`;
      } else {
        // Root level file
        path = `/${name}`;
      }
      
      // Check if a file with this path already exists
      const fileExists = currentProject.files.some(file => file.path === path);
      if (fileExists) {
        throw new Error(`A file at path ${path} already exists`);
      }
      
      // Create the new file object
      const newFile: File = {
        id: newId,
        name,
        type: 'file',
        path,
        content: ''
      };
      
      // Update parent directory's children array if it exists
      let updatedFiles = [...currentProject.files];
      
      if (parentId) {
        updatedFiles = updatedFiles.map(file => {
          if (file.id === parentId && file.type === 'directory') {
            return {
              ...file,
              children: [...(file.children || []), newId]
            };
          }
          return file;
        });
      }
      
      // Add the new file to the project's files
      updatedFiles.push(newFile);
      
      // Update the current project
      const updatedProject = {
        ...currentProject,
        files: updatedFiles
      };
      
      // Update state
      setCurrentProject(updatedProject);
      setFileTree(updatedFiles);
      
      // Update projects list
      setProjects(prev =>
        prev.map(project => 
          project.id === currentProject.id ? updatedProject : project
        )
      );
      
      // Save to local storage
      LocalStorageService.saveProject(updatedProject);
      
      // If online and logged in, sync with server
      if (user && !SyncService.isOffline()) {
        try {
          await syncWithServer();
        } catch (error) {
          console.error('Error syncing with server:', error);
          // Continue with local changes even if sync fails
        }
      }
      
      // Open the new file
      openFile(newFile);
      
      return newFile;
    } catch (error) {
      console.error('Error creating file:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createNewFolder = async (name: string, parentId?: string): Promise<File> => {
    if (!currentProject) {
      throw new Error("No project is currently open");
    }
    
    try {
      setLoading(true);
      
      // Generate a unique ID for the new folder
      const newId = uuidv4();
      
      // Determine the path for the new folder
      let path: string;
      
      if (parentId) {
        // Find parent directory
        const parentFile = currentProject.files.find(file => file.id === parentId);
        if (!parentFile || parentFile.type !== 'directory') {
          throw new Error("Invalid parent directory");
        }
        
        path = `${parentFile.path}/${name}`;
      } else {
        // Root level folder
        path = `/${name}`;
      }
      
      // Check if a folder with this path already exists
      const folderExists = currentProject.files.some(file => file.path === path);
      if (folderExists) {
        throw new Error(`A folder at path ${path} already exists`);
      }
      
      // Create the new folder object
      const newFolder: File = {
        id: newId,
        name,
        type: 'directory',
        path,
        children: []
      };
      
      // Update parent directory's children array if it exists
      let updatedFiles = [...currentProject.files];
      
      if (parentId) {
        updatedFiles = updatedFiles.map(file => {
          if (file.id === parentId && file.type === 'directory') {
            return {
              ...file,
              children: [...(file.children || []), newId]
            };
          }
          return file;
        });
      }
      
      // Add the new folder to the project's files
      updatedFiles.push(newFolder);
      
      // Update the current project
      const updatedProject = {
        ...currentProject,
        files: updatedFiles
      };
      
      // Update state
      setCurrentProject(updatedProject);
      setFileTree(updatedFiles);
      
      // Update projects list
      setProjects(prev =>
        prev.map(project => 
          project.id === currentProject.id ? updatedProject : project
        )
      );
      
      // Save to local storage
      LocalStorageService.saveProject(updatedProject);
      
      // If online and logged in, sync with server
      if (user && !SyncService.isOffline()) {
        try {
          await syncWithServer();
        } catch (error) {
          console.error('Error syncing with server:', error);
          // Continue even if sync fails
        }
      }
      
      return newFolder;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const exportProject = async (): Promise<string> => {
    if (!currentProject) {
      throw new Error("No project is currently open");
    }

    try {
      // Create a JSON representation of the project
      const projectData = JSON.stringify(currentProject, null, 2);
      
      // In a browser environment, trigger download
      const blob = new Blob([projectData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentProject.name.toLowerCase().replace(/\s+/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return a.download; // Return the filename
    } catch (error) {
      console.error('Error exporting project:', error);
      throw error;
    }
  };

  const deleteFile = async (fileId: string): Promise<void> => {
    if (!currentProject) throw new Error("No project is open");
    
    try {
      setLoading(true);
      
      const fileToDelete = findFileById(fileId);
      if (!fileToDelete) throw new Error("File not found");
      
      // If it's a directory, get all child files to delete them too
      const filesToDelete = new Set<string>([fileId]);
      
      const findAllChildren = (fileId: string) => {
        const file = findFileById(fileId);
        if (file && file.type === 'directory' && file.children) {
          file.children.forEach(childId => {
            filesToDelete.add(childId);
            findAllChildren(childId);
          });
        }
      };
      
      if (fileToDelete.type === 'directory') {
        findAllChildren(fileId);
      }
      
      // Check if any of these files are open, and close them
      openFiles.forEach(openFile => {
        if (filesToDelete.has(openFile.id)) {
          closeFile(openFile.id);
        }
      });
      
      // Find parent directory and remove the file from its children
      let updatedFiles = [...currentProject.files];
      
      const parentDir = updatedFiles.find(file => 
        file.type === 'directory' && 
        file.children?.includes(fileId)
      );
      
      if (parentDir) {
        updatedFiles = updatedFiles.map(file => {
          if (file.id === parentDir.id) {
            return {
              ...file,
              children: file.children?.filter(id => id !== fileId)
            };
          }
          return file;
        });
      }
      
      // Remove all deleted files
      updatedFiles = updatedFiles.filter(file => !filesToDelete.has(file.id));
      
      // Update project
      const updatedProject = {
        ...currentProject,
        files: updatedFiles
      };
      
      setCurrentProject(updatedProject);
      setFileTree(updatedFiles);
      
      // Update projects list
      setProjects(prev =>
        prev.map(project => 
          project.id === currentProject.id ? updatedProject : project
        )
      );
      
      // Save to local storage
      LocalStorageService.saveProject(updatedProject);
      
      // If online and logged in, sync with server
      if (user && !SyncService.isOffline()) {
        try {
          await syncWithServer();
        } catch (error) {
          console.error('Error syncing with server:', error);
          // Continue even if sync fails
        }
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const renameFile = async (fileId: string, newName: string): Promise<void> => {
    if (!currentProject) throw new Error("No project is open");
    
    try {
      setLoading(true);
      
      const fileToRename = findFileById(fileId);
      if (!fileToRename) throw new Error("File not found");
      
      // Calculate new path
      const dirPath = fileToRename.path.substring(0, fileToRename.path.lastIndexOf('/'));
      const newPath = dirPath === '' ? `/${newName}` : `${dirPath}/${newName}`;
      
      // Check if the path already exists
      const pathExists = currentProject.files.some(file => file.path === newPath && file.id !== fileId);
      if (pathExists) {
        throw new Error(`A file with name ${newName} already exists`);
      }
      
      // Update all paths for this file and its children (if it's a directory)
      let updatedFiles = [...currentProject.files];
      
      const updatePaths = (fileId: string, oldPath: string, newPath: string) => {
        updatedFiles = updatedFiles.map(file => {
          if (file.id === fileId) {
            return { ...file, name: newName, path: newPath };
          }
          
          // Update paths for children
          if (file.path.startsWith(oldPath + '/')) {
            const relativePath = file.path.substring(oldPath.length);
            return { ...file, path: newPath + relativePath };
          }
          
          return file;
        });
      };
      
      updatePaths(fileId, fileToRename.path, newPath);
      
      // Update open files if they're affected
      const updatedOpenFiles = openFiles.map(file => {
        if (file.id === fileId) {
          return { ...file, name: newName, path: newPath };
        }
        return file;
      });
      
      // Update current project
      const updatedProject = {
        ...currentProject,
        files: updatedFiles
      };
      
      setCurrentProject(updatedProject);
      setFileTree(updatedFiles);
      setOpenFiles(updatedOpenFiles);
      
      // Update current file if it's the renamed file
      if (currentFile?.id === fileId) {
        setCurrentFileState({
          ...currentFile,
          name: newName,
          path: newPath
        });
      }
      
      // Update projects list
      setProjects(prev =>
        prev.map(project => 
          project.id === currentProject.id ? updatedProject : project
        )
      );
      
      // Save to local storage
      LocalStorageService.saveProject(updatedProject);
      
      // If online and logged in, sync with server
      if (user && !SyncService.isOffline()) {
        try {
          await syncWithServer();
        } catch (error) {
          console.error('Error syncing with server:', error);
          // Continue even if sync fails
        }
      }
    } catch (error) {
      console.error('Error renaming file:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const copyFile = (fileId: string) => {
    const file = findFileById(fileId);
    if (!file) return;
    
    setClipboard(file);
  };

  const pasteFile = async (targetDirectoryId?: string): Promise<void> => {
    if (!currentProject || !clipboard) return;
    
    try {
      setLoading(true);
      
      const getNewFileName = (baseName: string, existingNames: string[]): string => {
        // Handle file extensions for files
        if (clipboard?.type === 'file') {
          const lastDotIndex = baseName.lastIndexOf('.');
          const extension = lastDotIndex > 0 ? baseName.substring(lastDotIndex) : '';
          const nameWithoutExt = lastDotIndex > 0 ? baseName.substring(0, lastDotIndex) : baseName;
          
          let newName = baseName;
          let counter = 1;
          
          while (existingNames.includes(newName)) {
            newName = `${nameWithoutExt} (${counter})${extension}`;
            counter++;
          }
          
          return newName;
        } else {
          // For directories
          let newName = baseName;
          let counter = 1;
          
          while (existingNames.includes(newName)) {
            newName = `${baseName} (${counter})`;
            counter++;
          }
          
          return newName;
        }
      };
      
      // Recursively copy the file and its children
      const copyFileWithChildren = (file: File, targetPath: string, newName?: string): File[] => {
        const copies: File[] = [];
        
        // Generate new ID for the copy
        const newId = uuidv4();
        
        // Create copy of the file
        const baseName = newName || file.name;
        const newPath = targetPath === '/' ? `/${baseName}` : `${targetPath}/${baseName}`;
        
        const fileCopy: File = {
          id: newId,
          name: baseName,
          type: file.type,
          path: newPath
        };
        
        if (file.type === 'file') {
          fileCopy.content = file.content;
        } else {
          // For directories, copy children recursively
          fileCopy.children = [];
          
          if (file.children && file.children.length > 0) {
            // Get all children
            const children = file.children.map(childId => findFileById(childId)).filter(Boolean) as File[];
            
            for (const child of children) {
              const childCopies = copyFileWithChildren(child, newPath);
              childCopies.forEach(childCopy => {
                fileCopy.children?.push(childCopy.id);
                copies.push(childCopy);
              });
            }
          }
        }
        
        copies.push(fileCopy);
        return copies;
      };
      
      // Determine target directory
      let targetDir: File | null = null;
      let targetPath = '/';
      
      if (targetDirectoryId) {
        targetDir = findFileById(targetDirectoryId);
        if (!targetDir || targetDir.type !== 'directory') {
          throw new Error('Invalid target directory');
        }
        targetPath = targetDir.path;
      }
      
      // Get list of existing files in the target directory
      const filesInTarget = currentProject.files.filter(file => {
        const parentPath = file.path.substring(0, file.path.lastIndexOf('/'));
        return parentPath === targetPath;
      });
      
      const existingNames = filesInTarget.map(file => file.name);
      
      // Generate unique name for the copy
      const newName = getNewFileName(clipboard.name, existingNames);
      
      // Copy the file and all its children
      const copies = copyFileWithChildren(clipboard, targetPath, newName);
      
      // Add the copies to the project
      let updatedFiles = [...currentProject.files, ...copies];
      
      // Update parent directory's children if needed
      if (targetDir) {
        updatedFiles = updatedFiles.map(file => {
          if (file.id === targetDir.id) {
            return {
              ...file,
              children: [...(file.children || []), copies[copies.length - 1].id]
            };
          }
          return file;
        });
      }
      
      // Update project
      const updatedProject = {
        ...currentProject,
        files: updatedFiles
      };
      
      setCurrentProject(updatedProject);
      setFileTree(updatedFiles);
      
      // Update projects list
      setProjects(prev =>
        prev.map(project => 
          project.id === currentProject.id ? updatedProject : project
        )
      );
      
      // Save to local storage
      LocalStorageService.saveProject(updatedProject);
      
      // If online and logged in, sync with server
      if (user && !SyncService.isOffline()) {
        try {
          await syncWithServer();
        } catch (error) {
          console.error('Error syncing with server:', error);
          // Continue even if sync fails
        }
      }
    } catch (error) {
      console.error('Error pasting file:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const moveFile = async (fileId: string, targetDirectoryId: string): Promise<void> => {
    if (!currentProject) return;
    
    try {
      setLoading(true);
      
      // Get file and target directory
      const fileToMove = findFileById(fileId);
      const targetDir = targetDirectoryId === 'root' ? null : findFileById(targetDirectoryId);
      
      if (!fileToMove) throw new Error('File not found');
      if (targetDirectoryId !== 'root' && (!targetDir || targetDir.type !== 'directory')) {
        throw new Error('Invalid target directory');
      }
      
      // Find current parent
      const currentParent = currentProject.files.find(file => 
        file.type === 'directory' && 
        file.children?.includes(fileId)
      );
      
      // Calculate new path
      const newPath = targetDirectoryId === 'root' 
        ? `/${fileToMove.name}` 
        : `${targetDir!.path}/${fileToMove.name}`;
      
      // Check if path already exists
      const pathExists = currentProject.files.some(file => 
        file.path === newPath && file.id !== fileId
      );
      
      if (pathExists) {
        throw new Error(`A file with name ${fileToMove.name} already exists in the destination directory`);
      }
      
      // Update paths for the file and all its children
      const oldPath = fileToMove.path;
      let updatedFiles = [...currentProject.files];
      
      // Update paths recursively
      const updateFilePaths = (files: File[], oldBasePath: string, newBasePath: string) => {
        return files.map(file => {
          if (file.id === fileId) {
            return { ...file, path: newPath };
          }
          
          if (file.path.startsWith(oldBasePath + '/')) {
            const relativePath = file.path.substring(oldBasePath.length);
            return { ...file, path: newBasePath + relativePath };
          }
          
          return file;
        });
      };
      
      updatedFiles = updateFilePaths(updatedFiles, oldPath, newPath);
      
      // Remove file from current parent
      if (currentParent) {
        updatedFiles = updatedFiles.map(file => {
          if (file.id === currentParent.id) {
            return {
              ...file,
              children: file.children?.filter(id => id !== fileId)
            };
          }
          return file;
        });
      }
      
      // Add file to new parent
      if (targetDir) {
        updatedFiles = updatedFiles.map(file => {
          if (file.id === targetDir.id) {
            return {
              ...file,
              children: [...(file.children || []), fileId]
            };
          }
          return file;
        });
      }
      
      // Update project
      const updatedProject = {
        ...currentProject,
        files: updatedFiles
      };
      
      setCurrentProject(updatedProject);
      setFileTree(updatedFiles);
      
      // Update open files paths if needed
      const updatedOpenFiles = openFiles.map(file => {
        if (file.id === fileId) {
          return { ...file, path: newPath };
        }
        return file;
      });
      
      setOpenFiles(updatedOpenFiles);
      
      // Update current file if it's the moved file
      if (currentFile?.id === fileId) {
        setCurrentFileState({
          ...currentFile,
          path: newPath
        });
      }
      
      // Update projects list
      setProjects(prev =>
        prev.map(project => 
          project.id === currentProject.id ? updatedProject : project
        )
      );
      
      // Save to local storage
      LocalStorageService.saveProject(updatedProject);
      
      // If online and logged in, sync with server
      if (user && !SyncService.isOffline()) {
        await syncWithServer();
      }
    } catch (error) {
      console.error('Error moving file:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const duplicateFile = async (fileId: string): Promise<File> => {
    if (!currentProject) throw new Error("No project is open");
    
    try {
      setLoading(true);
      
      const fileToDuplicate = findFileById(fileId);
      if (!fileToDuplicate) throw new Error("File not found");
      
      // Copy the file first
      copyFile(fileId);
      
      // Find the parent directory
      const parentDir = currentProject.files.find(file => 
        file.type === 'directory' && 
        file.children?.includes(fileId)
      );
      
      // Paste to the same parent
      if (parentDir) {
        await pasteFile(parentDir.id);
      } else {
        // Root level file
        await pasteFile();
      }
      
      // Find the newly created file (it will be the last file with same name pattern)
      const baseName = fileToDuplicate.name;
      const lastDotIndex = baseName.lastIndexOf('.');
      const extension = lastDotIndex > 0 ? baseName.substring(lastDotIndex) : '';
      const nameWithoutExt = lastDotIndex > 0 ? baseName.substring(0, lastDotIndex) : baseName;
      
      const pattern = fileToDuplicate.type === 'file' ? 
        new RegExp(`^${nameWithoutExt} \\(\\d+\\)${extension}$`) :
        new RegExp(`^${baseName} \\(\\d+\\)$`);
      
      const duplicatedFiles = currentProject.files.filter(file => 
        pattern.test(file.name) &&
        file.type === fileToDuplicate.type
      );
      
      // Sort by creation time to get the newest
      const newestFile = duplicatedFiles.sort((a, b) => {
        const aMatch = a.name.match(/\((\d+)\)/);
        const bMatch = b.name.match(/\((\d+)\)/);
        const aNum = aMatch ? parseInt(aMatch[1], 10) : 0;
        const bNum = bMatch ? parseInt(bMatch[1], 10) : 0;
        return bNum - aNum;
      })[0];
      
      return newestFile || fileToDuplicate;
    } catch (error) {
      console.error('Error duplicating file:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const reorderTabs = (newOrder: FileTab[]) => {
    setOpenFiles(newOrder);
    
    // Save to local storage
    if (currentProject) {
      LocalStorageService.saveOpenTabs(currentProject.id, newOrder);
    }
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

// Function to generate UUID
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Mock for SyncService
const SyncService = {
  isOffline: () => false,
  setOfflineMode: (offline: boolean) => {},
  onOfflineStatusChange: (listener: (offline: boolean) => void) => {},
  removeOfflineListener: (listener: (offline: boolean) => void) => {},
  onSyncStatusChange: (listener: (syncing: boolean) => void) => {},
  removeSyncListener: (listener: (syncing: boolean) => void) => {},
  forceSyncNow: async () => {}
};

// Mock for LocalStorageService
const LocalStorageService = {
  loadProjects: (): Project[] => [],
  saveProject: (project: Project) => {},
  loadRecentProjects: (): Project[] => [],
  saveRecentProjects: (projects: Project[]) => {},
  getCurrentProjectId: (): string | null => null,
  saveCurrentProjectId: (projectId: string | null) => {},
  loadOpenTabs: (projectId: string): FileTab[] => [],
  saveOpenTabs: (projectId: string, tabs: FileTab[]) => {},
  getCurrentFileId: (projectId: string): string | null => null,
  saveCurrentFileId: (projectId: string, fileId: string | null) => {},
  loadUnsavedFiles: (projectId: string): string[] => [],
  saveUnsavedFiles: (projectId: string, fileIds: string[]) => {}
};

// Mock for TemplateService
const TemplateService = {
  createFilesFromTemplate: (templateId: string): File[] => []
};