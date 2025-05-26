import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useProject } from '../../context/ProjectContext';
import { 
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  FolderOpen,
  Edit,
  Trash,
  Copy,
  ClipboardPaste,
  FilePlus,
  FolderPlus,
  MoreVertical,
  ExternalLink,
  Move
} from 'lucide-react';
import { File } from '../../types/editor';
import styles from './FileTree.module.css';

// Dialog Components
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel
}) => {
  const { colors } = useTheme();
  
  if (!isOpen) return null;
  
  return (
    <div className={styles.modalOverlay}>
      <div 
        className={styles.modalContent}
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        <h3 className={styles.modalTitle} style={{ color: colors.text }}>{title}</h3>
        <p className={styles.modalMessage} style={{ color: colors.textSecondary }}>{message}</p>
        <div className={styles.modalButtons}>
          <button 
            className={styles.cancelButton}
            onClick={onCancel}
            style={{ borderColor: colors.border, color: colors.text }}
          >
            {cancelLabel}
          </button>
          <button 
            className={styles.confirmButton}
            onClick={onConfirm}
            style={{ backgroundColor: colors.error, color: '#FFF' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

interface RenameDialogProps {
  isOpen: boolean;
  fileId: string;
  currentName: string;
  onRename: (fileId: string, newName: string) => void;
  onCancel: () => void;
}

const RenameDialog: React.FC<RenameDialogProps> = ({
  isOpen,
  fileId,
  currentName,
  onRename,
  onCancel
}) => {
  const { colors } = useTheme();
  const [newName, setNewName] = useState(currentName);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      // Select filename without extension
      const lastDotIndex = currentName.lastIndexOf('.');
      if (lastDotIndex > 0) {
        inputRef.current.setSelectionRange(0, lastDotIndex);
      } else {
        inputRef.current.select();
      }
    }
  }, [isOpen, currentName]);
  
  if (!isOpen) return null;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName && newName !== currentName) {
      onRename(fileId, newName);
    } else {
      onCancel();
    }
  };
  
  return (
    <div className={styles.modalOverlay}>
      <div 
        className={styles.modalContent}
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        <h3 className={styles.modalTitle} style={{ color: colors.text }}>Rename</h3>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            className={styles.modalInput}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{ 
              backgroundColor: colors.background, 
              color: colors.text,
              borderColor: colors.border
            }}
          />
          <div className={styles.modalButtons}>
            <button 
              type="button"
              className={styles.cancelButton}
              onClick={onCancel}
              style={{ borderColor: colors.border, color: colors.text }}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className={styles.confirmButton}
              style={{ backgroundColor: colors.primary, color: '#FFF' }}
            >
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ContextMenuOption {
  id: string;
  label: string;
  icon: React.ElementType;
  action: () => void;
  divider?: boolean;
}

interface FileItemProps {
  file: File;
  level: number;
  selectedFileId: string | null;
  onSelect: (fileId: string, event: React.MouseEvent) => void;
  onDragStart: (file: File, event: React.DragEvent) => void;
  onDragOver: (file: File, event: React.DragEvent) => void;
  onDrop: (targetFile: File, event: React.DragEvent) => void;
}

const FileItem: React.FC<FileItemProps> = ({ 
  file, 
  level, 
  selectedFileId, 
  onSelect,
  onDragStart,
  onDragOver,
  onDrop
}) => {
  const { colors } = useTheme();
  const { 
    fileTree, 
    openFile, 
    createNewFile, 
    createNewFolder, 
    deleteFile, 
    renameFile,
    copyFile,
    pasteFile,
    clipboard
  } = useProject();
  
  const [expanded, setExpanded] = useState(true);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const isDirectory = file.type === 'directory';
  const hasChildren = isDirectory && file.children && file.children.length > 0;
  const isSelected = selectedFileId === file.id;
  
  const toggleExpand = () => {
    setExpanded(!expanded);
  };
  
  const handlePress = (event: React.MouseEvent) => {
    if (isDirectory) {
      toggleExpand();
    } else {
      openFile(file);
    }
    onSelect(file.id, event);
  };
  
  const handleTouchStart = () => {
    // Start a timer for long press detection
    const timer = setTimeout(() => {
      onSelect(file.id, {} as React.MouseEvent);
    }, 500); // 500ms for long press
    setLongPressTimer(timer);
  };
  
  const handleTouchEnd = () => {
    // Clear the timer if touch ends before long press is detected
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };
  
  const handleRename = () => {
    setShowRenameDialog(true);
  };
  
  const confirmRename = async (fileId: string, newName: string) => {
    try {
      await renameFile(fileId, newName);
      setShowRenameDialog(false);
      // Deselect after action
      onSelect('', {} as React.MouseEvent);
    } catch (error) {
      console.error('Error renaming file:', error);
      alert(`Error renaming file: ${error}`);
    }
  };
  
  const handleDelete = () => {
    setShowConfirmDelete(true);
  };
  
  const confirmDelete = async () => {
    try {
      await deleteFile(file.id);
      setShowConfirmDelete(false);
      // Deselect after action
      onSelect('', {} as React.MouseEvent);
    } catch (error) {
      console.error('Error deleting file:', error);
      alert(`Error deleting file: ${error}`);
    }
  };
  
  const handleCopy = () => {
    copyFile(file.id);
    // Deselect after action
    onSelect('', {} as React.MouseEvent);
  };
  
  const handlePaste = async () => {
    if (isDirectory) {
      await pasteFile(file.id);
      // Deselect after action
      onSelect('', {} as React.MouseEvent);
    }
  };
  
  const handleNewFile = async () => {
    if (isDirectory) {
      const newFileName = prompt('Enter new file name:');
      if (newFileName) {
        await createNewFile(newFileName, file.id);
        // Ensure directory is expanded after creating a file
        setExpanded(true);
      }
      // Deselect after action
      onSelect('', {} as React.MouseEvent);
    }
  };
  
  const handleNewFolder = async () => {
    if (isDirectory) {
      const newFolderName = prompt('Enter new folder name:');
      if (newFolderName) {
        await createNewFolder(newFolderName, file.id);
        // Ensure directory is expanded after creating a folder
        setExpanded(true);
      }
      // Deselect after action
      onSelect('', {} as React.MouseEvent);
    }
  };

  // Handle drag and drop
  const handleDragStart = (event: React.DragEvent) => {
    setIsDragging(true);
    event.stopPropagation();
    onDragStart(file, event);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (isDirectory) {
      setIsDragOver(true);
      onDragOver(file, event);
    }
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
    
    if (isDirectory) {
      onDrop(file, event);
      // Auto-expand the directory when items are dropped into it
      setExpanded(true);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };
  
  const getContextMenuOptions = (): ContextMenuOption[] => {
    const options: ContextMenuOption[] = [
      {
        id: 'rename',
        label: 'Rename',
        icon: Edit,
        action: handleRename
      },
      {
        id: 'copy',
        label: 'Copy',
        icon: Copy,
        action: handleCopy
      }
    ];
    
    // Add paste option if there's something in the clipboard
    if (isDirectory && clipboard) {
      options.push({
        id: 'paste',
        label: 'Paste',
        icon: ClipboardPaste,
        action: handlePaste
      });
    }
    
    if (isDirectory) {
      // Add directory-specific options with a divider
      options.push(
        {
          id: 'divider1',
          label: '',
          icon: () => null,
          action: () => {},
          divider: true
        },
        {
          id: 'newFile',
          label: 'New File',
          icon: FilePlus,
          action: handleNewFile
        },
        {
          id: 'newFolder',
          label: 'New Folder',
          icon: FolderPlus,
          action: handleNewFolder
        }
      );
    }
    
    // Add delete option with divider
    options.push(
      {
        id: 'divider2',
        label: '',
        icon: () => null,
        action: () => {},
        divider: true
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: Trash,
        action: handleDelete
      }
    );
    
    return options;
  };
  
  const indent = level * 12;
  
  return (
    <div>
      <div
        className={`${styles.fileItem} ${isDragOver ? styles.dragOver : ''} ${isDragging ? styles.dragging : ''}`}
        style={{ 
          paddingLeft: 16 + indent,
          backgroundColor: isSelected ? colors.selectedItem : 
                          isDragOver ? `${colors.primary}15` : 'transparent',
          borderColor: isDragOver ? colors.primary : 'transparent',
        }}
        onClick={handlePress}
        onContextMenu={(e) => {
          e.preventDefault();
          onSelect(file.id, e);
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
        data-file-id={file.id}
      >
        <div className={styles.fileIcon}>
          {isDirectory ? (
            hasChildren ? (
              expanded ? (
                <ChevronDown size={14} color={colors.textSecondary} />
              ) : (
                <ChevronRight size={14} color={colors.textSecondary} />
              )
            ) : (
              <div style={{ width: 14 }} />
            )
          ) : (
            <div style={{ width: 14 }} />
          )}
        </div>
        
        <div className={styles.fileTypeIcon}>
          {isDirectory ? (
            expanded ? (
              <FolderOpen size={16} color="#FFCA28" />
            ) : (
              <Folder size={16} color="#FFCA28" />
            )
          ) : (
            <FileText size={16} color={colors.primary} />
          )}
        </div>
        
        <span
          className={styles.fileName}
          style={{ color: isSelected ? colors.textHighlight : colors.text }}
        >
          {file.name}
        </span>
        
        <div className={styles.fileActions}>
          <button
            className={styles.actionButton}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(file.id, e);
            }}
          >
            <MoreVertical size={14} color={colors.textSecondary} />
          </button>
        </div>
      </div>
      
      {isSelected && (
        <div 
          className={styles.contextMenu}
          style={{ 
            marginLeft: 16 + indent,
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {getContextMenuOptions().map(option => 
            option.divider ? (
              <div 
                key={option.id}
                className={styles.divider}
                style={{ backgroundColor: colors.border }}
              />
            ) : (
              <button
                key={option.id}
                className={styles.contextMenuItem}
                onClick={(e) => {
                  e.stopPropagation();
                  option.action();
                }}
              >
                <option.icon size={16} color={colors.text} className={styles.contextMenuIcon} />
                <span style={{ color: colors.text }}>{option.label}</span>
              </button>
            )
          )}
        </div>
      )}
      
      {isDirectory && expanded && hasChildren && (
        <div>
          {file.children?.map((childId) => {
            const childFile = fileTree.find((f) => f.id === childId);
            if (childFile) {
              return (
                <FileItem
                  key={childFile.id}
                  file={childFile}
                  level={level + 1}
                  selectedFileId={selectedFileId}
                  onSelect={onSelect}
                  onDragStart={onDragStart}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                />
              );
            }
            return null;
          })}
        </div>
      )}
      
      {/* Confirmation Dialog for Delete */}
      <ConfirmDialog
        isOpen={showConfirmDelete}
        title="Confirm Delete"
        message={`Are you sure you want to delete "${file.name}"${isDirectory ? ' and all its contents' : ''}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirmDelete(false)}
      />
      
      {/* Rename Dialog */}
      <RenameDialog
        isOpen={showRenameDialog}
        fileId={file.id}
        currentName={file.name}
        onRename={confirmRename}
        onCancel={() => setShowRenameDialog(false)}
      />
    </div>
  );
};

const FileTree: React.FC = () => {
  const { colors } = useTheme();
  const { fileTree, pasteFile, clipboard, createNewFile, createNewFolder } = useProject();
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [draggedFile, setDraggedFile] = useState<File | null>(null);
  const [showDropZone, setShowDropZone] = useState(false);
  
  // Get only root files (files without parents or at the top level)
  const rootFiles = fileTree.filter((file) => {
    // Check if this file is not a child of any other directory
    return !fileTree.some((parentFile) => 
      parentFile.type === 'directory' && 
      parentFile.children?.includes(file.id)
    );
  });
  
  // Handle clicks outside of files to deselect
  const handleContainerClick = (e: React.MouseEvent) => {
    // Only deselect if clicking directly on the container
    // and not on a file item or context menu
    if ((e.target as HTMLElement).className === styles.container) {
      setSelectedFileId(null);
    }
  };
  
  // Handle paste at root level
  const handleRootPaste = async () => {
    if (clipboard) {
      await pasteFile(); // No directory ID means paste to root
      setSelectedFileId(null);
    }
  };
  
  // Handle selection of a file
  const handleSelect = (fileId: string, event: React.MouseEvent) => {
    // If right-click or context menu is open, select the file
    if (event.button === 2 || event.type === 'contextmenu' || !selectedFileId) {
      setSelectedFileId(fileId === selectedFileId ? null : fileId);
    }
  };
  
  // Handle drag and drop
  const handleDragStart = (file: File, event: React.DragEvent) => {
    setDraggedFile(file);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/json', JSON.stringify({
      id: file.id,
      type: file.type,
      name: file.name
    }));
  };
  
  const handleRootDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setShowDropZone(true);
  };
  
  const handleRootDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setShowDropZone(false);
  };
  
  const handleRootDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    setShowDropZone(false);
    
    if (draggedFile) {
      // Move file to root (pasteFile implementation would handle this)
      console.log('Move file to root:', draggedFile.name);
    }
    
    setDraggedFile(null);
  };
  
  const handleDragOver = (file: File, event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };
  
  const handleDrop = async (targetFile: File, event: React.DragEvent) => {
    event.preventDefault();
    
    if (draggedFile && targetFile.id !== draggedFile.id && targetFile.type === 'directory') {
      // Move file to target directory
      console.log(`Move ${draggedFile.name} to ${targetFile.name}`);
      
      // In a real implementation, we would call a method like:
      // await moveFile(draggedFile.id, targetFile.id);
    }
    
    setDraggedFile(null);
  };
  
  // Create new file at root level
  const handleNewRootFile = async () => {
    const fileName = prompt('Enter new file name:');
    if (fileName) {
      await createNewFile(fileName);
    }
  };
  
  // Create new folder at root level
  const handleNewRootFolder = async () => {
    const folderName = prompt('Enter new folder name:');
    if (folderName) {
      await createNewFolder(folderName);
    }
  };

  return (
    <div 
      className={`${styles.container} ${showDropZone ? styles.dropTarget : ''}`}
      onClick={handleContainerClick}
      onDragOver={handleRootDragOver}
      onDragLeave={handleRootDragLeave}
      onDrop={handleRootDrop}
      style={{ borderColor: showDropZone ? colors.primary : 'transparent' }}
    >
      <div className={styles.fileTreeHeader}>
        <h3 className={styles.fileTreeTitle} style={{ color: colors.text }}>Explorer</h3>
        <div className={styles.fileTreeActions}>
          <button 
            className={styles.fileTreeAction}
            onClick={handleNewRootFile}
            title="New File"
          >
            <FilePlus size={16} color={colors.textSecondary} />
          </button>
          <button 
            className={styles.fileTreeAction}
            onClick={handleNewRootFolder}
            title="New Folder"
          >
            <FolderPlus size={16} color={colors.textSecondary} />
          </button>
        </div>
      </div>
      
      {rootFiles.map((file) => (
        <FileItem 
          key={file.id} 
          file={file} 
          level={0} 
          selectedFileId={selectedFileId}
          onSelect={handleSelect}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
      ))}
      
      {/* Root context menu - shown when clicking empty space and clipboard has content */}
      {selectedFileId === null && clipboard && (
        <div className={styles.rootContextMenu}>
          <button
            className={styles.rootContextMenuItem}
            onClick={handleRootPaste}
            style={{
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: colors.border
            }}
          >
            <ClipboardPaste size={16} color={colors.text} className={styles.contextMenuIcon} />
            <span>Paste</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default FileTree;