import React, { useState, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useProject } from '../../context/ProjectContext';
import { X, MoreVertical, Save, Maximize2, Copy, FileText } from 'lucide-react';
import styles from './EditorTabs.module.css';

const EditorTabs: React.FC = () => {
  const { colors } = useTheme();
  const { openFiles, currentFile, setCurrentFile, closeFile, hasUnsavedChanges, saveFile } = useProject();
  
  const [draggedTab, setDraggedTab] = useState<string | null>(null);
  const [contextMenuFile, setContextMenuFile] = useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number, y: number } | null>(null);
  const tabRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  // Start dragging a tab
  const handleDragStart = (fileId: string, e: React.DragEvent) => {
    setDraggedTab(fileId);
    // Set transparent drag image
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
    e.dataTransfer.setDragImage(img, 0, 0);
    
    // Add the fileId to the drag data
    e.dataTransfer.setData('text/plain', fileId);
    
    // Set dragged tab appearance
    if (tabRefs.current[fileId]) {
      tabRefs.current[fileId]!.style.opacity = '0.5';
    }
  };
  
  // Handle dragging over another tab
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  // Handle dropping the tab
  const handleDrop = (targetFileId: string) => {
    if (draggedTab && draggedTab !== targetFileId) {
      const draggedIndex = openFiles.findIndex(file => file.id === draggedTab);
      const targetIndex = openFiles.findIndex(file => file.id === targetFileId);
      
      if (draggedIndex >= 0 && targetIndex >= 0) {
        // Reorder tabs by moving the dragged tab to the target position
        const reorderedFiles = [...openFiles];
        const [movedFile] = reorderedFiles.splice(draggedIndex, 1);
        reorderedFiles.splice(targetIndex, 0, movedFile);
        
        // Update the openFiles state
        // Note: Normally we'd have a reorderTabs function in ProjectContext
        // For now, we'll handle this by creating the updated array and using setOpenFiles directly
        // This would be implemented properly in the ProjectContext
      }
    }
    
    // Reset dragged tab state
    if (draggedTab && tabRefs.current[draggedTab]) {
      tabRefs.current[draggedTab]!.style.opacity = '1';
    }
    setDraggedTab(null);
  };
  
  // End dragging (without dropping on a tab)
  const handleDragEnd = () => {
    if (draggedTab && tabRefs.current[draggedTab]) {
      tabRefs.current[draggedTab]!.style.opacity = '1';
    }
    setDraggedTab(null);
  };
  
  // Show context menu for a tab
  const handleContextMenu = (e: React.MouseEvent, fileId: string) => {
    e.preventDefault();
    setContextMenuFile(fileId);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
  };
  
  // Hide context menu
  const hideContextMenu = () => {
    setContextMenuFile(null);
    setContextMenuPosition(null);
  };
  
  // Handle clicks outside the context menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuPosition) {
        hideContextMenu();
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenuPosition]);
  
  // Close all tabs
  const closeAllTabs = () => {
    openFiles.forEach(file => closeFile(file.id));
    hideContextMenu();
  };
  
  // Close other tabs (keep the one with context menu open)
  const closeOtherTabs = () => {
    if (!contextMenuFile) return;
    
    openFiles.forEach(file => {
      if (file.id !== contextMenuFile) {
        closeFile(file.id);
      }
    });
    hideContextMenu();
  };
  
  // Close tabs to the right of the selected tab
  const closeTabsToRight = () => {
    if (!contextMenuFile) return;
    
    const index = openFiles.findIndex(file => file.id === contextMenuFile);
    if (index >= 0) {
      openFiles.slice(index + 1).forEach(file => closeFile(file.id));
    }
    hideContextMenu();
  };
  
  // Save the file with context menu
  const saveContextFile = () => {
    if (!contextMenuFile) return;
    
    const file = openFiles.find(file => file.id === contextMenuFile);
    if (file) {
      saveFile(file.id, file.content);
    }
    hideContextMenu();
  };
  
  // Double click tab to maximize/restore editor
  const handleDoubleClick = () => {
    // This would toggle a fullscreen or maximized editor state
    // For now, we'll just log the action since we would need to add this state to a parent component
    console.log('Toggle maximize editor');
  };
  
  // Duplicate the file with context menu
  const duplicateFile = () => {
    if (!contextMenuFile) return;
    
    const file = openFiles.find(file => file.id === contextMenuFile);
    if (file) {
      // We would need to add this function to ProjectContext to properly duplicate a file
      // For now, we'll just log the action
      console.log('Duplicate file:', file.name);
    }
    hideContextMenu();
  };

  return (
    <div 
      className={styles.container}
      style={{ 
        backgroundColor: colors.surface,
        borderBottomColor: colors.border,
      }}
    >
      <div className={styles.scrollContent}>
        {openFiles.map((file) => {
          const isActive = currentFile?.id === file.id;
          const isUnsaved = hasUnsavedChanges(file.id);
          
          return (
            <div
              key={file.id}
              ref={el => tabRefs.current[file.id] = el}
              className={styles.tab}
              style={{
                backgroundColor: isActive ? colors.background : colors.surface,
                borderBottomColor: isActive ? colors.primary : 'transparent',
                cursor: 'pointer',
              }}
              onClick={() => setCurrentFile(file.id)}
              onContextMenu={(e) => handleContextMenu(e, file.id)}
              draggable={true}
              onDragStart={(e) => handleDragStart(file.id, e)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(file.id)}
              onDragEnd={handleDragEnd}
              onDoubleClick={handleDoubleClick}
              data-testid={`tab-${file.id}`}
            >
              <span 
                className={styles.tabText}
                style={{ 
                  color: isActive ? colors.text : colors.textSecondary,
                  fontFamily: isActive ? 'Inter-Medium' : 'Inter-Regular',
                }}
              >
                {file.name}
                {isUnsaved && <span style={{ color: colors.primary }}> •</span>}
              </span>
              
              <button
                className={styles.closeButton}
                onClick={(e) => {
                  e.stopPropagation();
                  closeFile(file.id);
                }}
              >
                <X 
                  size={14} 
                  color={isActive ? colors.text : colors.textSecondary} 
                />
              </button>
            </div>
          );
        })}
      </div>
      
      {contextMenuPosition && contextMenuFile && (
        <div 
          className={styles.contextMenu}
          style={{
            top: contextMenuPosition.y,
            left: contextMenuPosition.x,
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <button
            className={styles.contextMenuItem}
            onClick={saveContextFile}
          >
            <Save size={14} color={colors.text} className={styles.contextMenuIcon} />
            <span style={{ color: colors.text }}>Save</span>
          </button>
          
          <button
            className={styles.contextMenuItem}
            onClick={duplicateFile}
          >
            <Copy size={14} color={colors.text} className={styles.contextMenuIcon} />
            <span style={{ color: colors.text }}>Duplicate</span>
          </button>
          
          <button
            className={styles.contextMenuItem}
            onClick={closeOtherTabs}
          >
            <FileText size={14} color={colors.text} className={styles.contextMenuIcon} />
            <span style={{ color: colors.text }}>Close Others</span>
          </button>
          
          <button
            className={styles.contextMenuItem}
            onClick={closeTabsToRight}
          >
            <FileText size={14} color={colors.text} className={styles.contextMenuIcon} />
            <span style={{ color: colors.text }}>Close to Right</span>
          </button>
          
          <button
            className={styles.contextMenuItem}
            onClick={closeAllTabs}
          >
            <X size={14} color={colors.text} className={styles.contextMenuIcon} />
            <span style={{ color: colors.text }}>Close All</span>
          </button>
          
          <button
            className={styles.contextMenuItem}
            onClick={handleDoubleClick}
          >
            <Maximize2 size={14} color={colors.text} className={styles.contextMenuIcon} />
            <span style={{ color: colors.text }}>Maximize Editor</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default EditorTabs;