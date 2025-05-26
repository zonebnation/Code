import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useProject } from '../../context/ProjectContext';
import { 
  FilePlus, 
  FolderPlus,
  Trash,
  Edit,
  Copy,
  ClipboardPaste,
  Move,
  Plus,
  MoreHorizontal
} from 'lucide-react';
import { File } from '../../types/editor';
import DraggableFileItem from './DraggableFileItem';
import NewFileDialog, { FileType } from '../Explorer/NewFileDialog';
import ConfirmDialog from '../shared/ConfirmDialog';
import RenameDialog from '../shared/RenameDialog';
import ContextMenu from '../shared/ContextMenu';
import styles from './EnhancedFileTree.module.css';

const EnhancedFileTree: React.FC = () => {
  const { colors } = useTheme();
  const { 
    fileTree, 
    currentProject, 
    openFile, 
    createNewFile, 
    createNewFolder,
    renameFile,
    deleteFile, 
    copyFile, 
    pasteFile, 
    moveFile, 
    clipboard,
    duplicateFile
  } = useProject();
  
  // State for file operations
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [draggedFile, setDraggedFile] = useState<File | null>(null);
  const [showDropZone, setShowDropZone] = useState(false);
  
  // Dialog states
  const [newFileDialogOpen, setNewFileDialogOpen] = useState(false);
  const [newFileType, setNewFileType] = useState<FileType>('file');
  const [newFileParentId, setNewFileParentId] = useState<string | undefined>(undefined);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<File | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [fileToRename, setFileToRename] = useState<File | null>(null);
  
  // Context menu
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    file: File | null;
    items: { id: string; label: string; icon: JSX.Element; action: () => void; divider?: boolean }[];
  }>({
    visible: false,
    x: 0,
    y: 0,
    file: null,
    items: []
  });

  // Initialize expanded directories
  useEffect(() => {
    // Auto-expand all directories initially
    const dirs = new Set<string>();
    fileTree.forEach(file => {
      if (file.type === 'directory') {
        dirs.add(file.id);
      }
    });
    setExpandedDirs(dirs);
  }, [currentProject]);
  
  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        setContextMenu(prev => ({ ...prev, visible: false }));
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu.visible]);
  
  if (!currentProject || fileTree.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p style={{ color: colors.textSecondary }}>
          No files in this project yet.
        </p>
        <div className={styles.emptyActions}>
          <button 
            className={styles.emptyAction}
            onClick={() => {
              setNewFileType('file');
              setNewFileParentId(undefined);
              setNewFileDialogOpen(true);
            }}
            style={{ backgroundColor: colors.primary }}
          >
            <FilePlus size={16} color="white" />
            <span>Create File</span>
          </button>
          <button 
            className={styles.emptyAction}
            onClick={() => {
              setNewFileType('folder');
              setNewFileParentId(undefined);
              setNewFileDialogOpen(true);
            }}
            style={{ backgroundColor: colors.secondary }}
          >
            <FolderPlus size={16} color="white" />
            <span>Create Folder</span>
          </button>
        </div>
      </div>
    );
  }
  
  // Get root files (not children of any directory)
  const rootFiles = fileTree.filter(file => {
    return !fileTree.some(parent => 
      parent.type === 'directory' && 
      parent.children?.includes(file.id)
    );
  });
  
  // Toggle directory expansion
  const toggleExpand = (fileId: string) => {
    setExpandedDirs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };
  
  // Select a file
  const handleSelect = (fileId: string, event: React.MouseEvent) => {
    if (event.button === 2 || event.type === 'contextmenu') {
      // Right-click - handle in context menu
      return;
    }
    setSelectedFileId(fileId === selectedFileId ? null : fileId);
  };
  
  // Show context menu for a file
  const handleContextMenu = (file: File, event: React.MouseEvent) => {
    event.preventDefault();
    
    // Generate context menu items based on file type
    const menuItems = [];
    
    // Common items
    if (file.type === 'file') {
      menuItems.push({
        id: 'open',
        label: 'Open',
        icon: <FilePlus size={16} color={colors.text} />,
        action: () => openFile(file)
      });
    } else {
      menuItems.push({
        id: 'toggleExpand',
        label: expandedDirs.has(file.id) ? 'Collapse' : 'Expand',
        icon: <Plus size={16} color={colors.text} />,
        action: () => toggleExpand(file.id)
      });
    }
    
    menuItems.push(
      {
        id: 'rename',
        label: 'Rename',
        icon: <Edit size={16} color={colors.text} />,
        action: () => {
          setFileToRename(file);
          setRenameDialogOpen(true);
        }
      },
      {
        id: 'duplicate',
        label: 'Duplicate',
        icon: <Copy size={16} color={colors.text} />,
        action: () => duplicateFile(file.id)
      }
    );
    
    // Directory-specific actions
    if (file.type === 'directory') {
      menuItems.push({
        id: 'divider1',
        label: '',
        icon: <div />,
        action: () => {},
        divider: true
      });
      
      menuItems.push(
        {
          id: 'newFile',
          label: 'New File',
          icon: <FilePlus size={16} color={colors.text} />,
          action: () => {
            setNewFileType('file');
            setNewFileParentId(file.id);
            setNewFileDialogOpen(true);
          }
        },
        {
          id: 'newFolder',
          label: 'New Folder',
          icon: <FolderPlus size={16} color={colors.text} />,
          action: () => {
            setNewFileType('folder');
            setNewFileParentId(file.id);
            setNewFileDialogOpen(true);
          }
        }
      );
      
      // Add paste option if there's something in the clipboard
      if (clipboard) {
        menuItems.push({
          id: 'paste',
          label: 'Paste',
          icon: <ClipboardPaste size={16} color={colors.text} />,
          action: () => pasteFile(file.id)
        });
      }
    }
    
    menuItems.push(
      {
        id: 'divider2',
        label: '',
        icon: <div />,
        action: () => {},
        divider: true
      },
      {
        id: 'copy',
        label: 'Copy',
        icon: <Copy size={16} color={colors.text} />,
        action: () => copyFile(file.id)
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: <Trash size={16} color={colors.error} />,
        action: () => {
          setFileToDelete(file);
          setConfirmDeleteOpen(true);
        }
      }
    );
    
    // Show context menu at mouse position
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      file,
      items: menuItems
    });
  };
  
  // Handle file/folder creation
  const handleCreateFile = async (name: string, type: FileType) => {
    try {
      if (type === 'file') {
        await createNewFile(name, newFileParentId);
      } else {
        await createNewFolder(name, newFileParentId);
      }
      
      // Auto-expand parent folder
      if (newFileParentId) {
        setExpandedDirs(prev => {
          const newSet = new Set(prev);
          newSet.add(newFileParentId);
          return newSet;
        });
      }
    } catch (error) {
      console.error(`Error creating ${type}:`, error);
      throw error;
    }
  };
  
  // Handle file rename
  const handleRename = async (newName: string) => {
    if (!fileToRename) return;
    
    try {
      await renameFile(fileToRename.id, newName);
      setRenameDialogOpen(false);
      setFileToRename(null);
    } catch (error) {
      console.error('Error renaming file:', error);
      throw error;
    }
  };
  
  // Handle file delete
  const handleDelete = async () => {
    if (!fileToDelete) return;
    
    try {
      await deleteFile(fileToDelete.id);
      setConfirmDeleteOpen(false);
      setFileToDelete(null);
      setSelectedFileId(null);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };
  
  // Drag and drop handling
  const handleDragStart = (event: React.DragEvent, file: File) => {
    setDraggedFile(file);
    event.dataTransfer.setData('application/json', JSON.stringify({
      id: file.id,
      type: file.type,
      name: file.name
    }));
  };
  
  const handleDragOver = (event: React.DragEvent, file: File) => {
    event.preventDefault();
    // Only allow dropping on directories
    if (file.type === 'directory') {
      event.dataTransfer.dropEffect = 'move';
    } else {
      event.dataTransfer.dropEffect = 'none';
    }
  };
  
  const handleDrop = async (event: React.DragEvent, targetFile: File) => {
    event.preventDefault();
    
    if (!draggedFile || targetFile.id === draggedFile.id || targetFile.type !== 'directory') {
      return;
    }
    
    // Move the file to the target directory
    await moveFile(draggedFile.id, targetFile.id);
    setDraggedFile(null);
    
    // Auto-expand the target directory
    setExpandedDirs(prev => {
      const newSet = new Set(prev);
      newSet.add(targetFile.id);
      return newSet;
    });
  };
  
  const handleDragEnd = () => {
    setDraggedFile(null);
  };
  
  // Root drag handling
  const handleRootDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    if (draggedFile) {
      event.dataTransfer.dropEffect = 'move';
      setShowDropZone(true);
    }
  };
  
  const handleRootDragLeave = () => {
    setShowDropZone(false);
  };
  
  const handleRootDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    setShowDropZone(false);
    
    if (draggedFile) {
      // Find the parent directory of the dragged file
      let parentId: string | undefined;
      fileTree.forEach(file => {
        if (file.type === 'directory' && file.children?.includes(draggedFile.id)) {
          parentId = file.id;
        }
      });
      
      if (parentId) {
        // Move file to root
        await moveFile(draggedFile.id, 'root');
      }
    }
    
    setDraggedFile(null);
  };
  
  const renderFileTree = (files: File[], parentId: string | null = null) => {
    return files.map(file => {
      const isExpanded = expandedDirs.has(file.id);
      const isSelected = selectedFileId === file.id;
      const isParent = parentId === null;
      
      // Determine child files if this is a directory
      const childFiles = file.type === 'directory' && file.children 
        ? file.children.map(id => fileTree.find(f => f.id === id)).filter(Boolean) as File[]
        : [];
      
      return (
        <React.Fragment key={file.id}>
          <DraggableFileItem
            file={file}
            level={isParent ? 0 : 1}
            selected={isSelected}
            expanded={isExpanded}
            onSelect={handleSelect}
            onToggleExpand={toggleExpand}
            onOpen={openFile}
            onContextMenu={handleContextMenu}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
          />
          
          {file.type === 'directory' && isExpanded && childFiles.length > 0 && (
            <div className={styles.nestedFiles}>
              {renderFileTree(childFiles, file.id)}
            </div>
          )}
        </React.Fragment>
      );
    });
  };

  return (
    <>
      <div 
        className={`${styles.container} ${showDropZone ? styles.dropTarget : ''}`}
        onDragOver={handleRootDragOver}
        onDragLeave={handleRootDragLeave}
        onDrop={handleRootDrop}
        style={{ borderColor: showDropZone ? colors.primary : 'transparent' }}
      >
        <div className={styles.header}>
          <h3 className={styles.title} style={{ color: colors.text }}>Files</h3>
          <div className={styles.actions}>
            <button 
              className={styles.action}
              onClick={() => {
                setNewFileType('file');
                setNewFileParentId(undefined);
                setNewFileDialogOpen(true);
              }}
              title="New File"
            >
              <FilePlus size={16} color={colors.textSecondary} />
            </button>
            <button 
              className={styles.action}
              onClick={() => {
                setNewFileType('folder');
                setNewFileParentId(undefined);
                setNewFileDialogOpen(true);
              }}
              title="New Folder"
            >
              <FolderPlus size={16} color={colors.textSecondary} />
            </button>
            <button 
              className={styles.action}
              onClick={(e) => {
                e.stopPropagation();
                // Show root context menu
                const rootMenuItems = [
                  {
                    id: 'newFile',
                    label: 'New File',
                    icon: <FilePlus size={16} color={colors.text} />,
                    action: () => {
                      setNewFileType('file');
                      setNewFileParentId(undefined);
                      setNewFileDialogOpen(true);
                    }
                  },
                  {
                    id: 'newFolder',
                    label: 'New Folder',
                    icon: <FolderPlus size={16} color={colors.text} />,
                    action: () => {
                      setNewFileType('folder');
                      setNewFileParentId(undefined);
                      setNewFileDialogOpen(true);
                    }
                  }
                ];
                
                if (clipboard) {
                  rootMenuItems.push({
                    id: 'paste',
                    label: 'Paste',
                    icon: <ClipboardPaste size={16} color={colors.text} />,
                    action: () => pasteFile()
                  });
                }
                
                setContextMenu({
                  visible: true,
                  x: e.clientX,
                  y: e.clientY,
                  file: null,
                  items: rootMenuItems
                });
              }}
            >
              <MoreHorizontal size={16} color={colors.textSecondary} />
            </button>
          </div>
        </div>
        
        <div className={styles.fileList}>
          {renderFileTree(rootFiles)}
        </div>
      </div>
      
      {/* Dialogs */}
      <NewFileDialog
        isOpen={newFileDialogOpen}
        fileType={newFileType}
        parentPath={newFileParentId ? fileTree.find(f => f.id === newFileParentId)?.path : undefined}
        onClose={() => setNewFileDialogOpen(false)}
        onCreateFile={handleCreateFile}
      />
      
      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Confirm Delete"
        message={`Are you sure you want to delete "${fileToDelete?.name}"${fileToDelete?.type === 'directory' ? ' and all its contents' : ''}? This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
        isDangerous
      />
      
      <RenameDialog
        isOpen={renameDialogOpen}
        currentName={fileToRename?.name || ''}
        onRename={handleRename}
        onCancel={() => {
          setRenameDialogOpen(false);
          setFileToRename(null);
        }}
      />
      
      {/* Context Menu */}
      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        items={contextMenu.items}
        onClose={() => setContextMenu(prev => ({ ...prev, visible: false }))}
      />
    </>
  );
};

export default EnhancedFileTree;