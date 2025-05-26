import React, { useState, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { File } from '../../types/editor';
import { 
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  FolderOpen,
  MoreVertical
} from 'lucide-react';
import styles from './DraggableFileItem.module.css';

interface DraggableFileItemProps {
  file: File;
  level: number;
  selected: boolean;
  expanded: boolean;
  onSelect: (id: string, event: React.MouseEvent) => void;
  onToggleExpand: (id: string) => void;
  onOpen: (file: File) => void;
  onContextMenu: (file: File, event: React.MouseEvent) => void;
  onDragStart: (event: React.DragEvent, file: File) => void;
  onDragOver: (event: React.DragEvent, file: File) => void;
  onDrop: (event: React.DragEvent, file: File) => void;
  onDragEnd: (event: React.DragEvent) => void;
}

const DraggableFileItem: React.FC<DraggableFileItemProps> = ({
  file,
  level,
  selected,
  expanded,
  onSelect,
  onToggleExpand,
  onOpen,
  onContextMenu,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop
}) => {
  const { colors } = useTheme();
  const [isDragOver, setIsDragOver] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  
  const indent = level * 12;
  const isDirectory = file.type === 'directory';
  const hasChildren = isDirectory && file.children && file.children.length > 0;
  
  const handleClick = (event: React.MouseEvent) => {
    if (isDirectory) {
      onToggleExpand(file.id);
    } else {
      onOpen(file);
    }
    onSelect(file.id, event);
  };
  
  const handleDragStart = (event: React.DragEvent) => {
    event.stopPropagation();
    onDragStart(event, file);
    
    // For better drag ghost image
    if (event.dataTransfer.setDragImage && itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      event.dataTransfer.setDragImage(itemRef.current, offsetX, 10);
    }
  };
  
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Only allow dropping on directories
    if (isDirectory) {
      event.dataTransfer.dropEffect = 'move';
      setIsDragOver(true);
      onDragOver(event, file);
    }
  };
  
  const handleDragLeave = () => {
    setIsDragOver(false);
  };
  
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
    
    if (isDirectory) {
      onDrop(event, file);
    }
  };
  
  return (
    <div 
      ref={itemRef}
      className={`${styles.fileItem} ${selected ? styles.selected : ''} ${isDragOver ? styles.dragOver : ''}`}
      style={{ 
        paddingLeft: 16 + indent,
        backgroundColor: selected ? colors.selectedItem : isDragOver ? `${colors.primary}15` : 'transparent',
        borderColor: isDragOver ? colors.primary : 'transparent'
      }}
      onClick={handleClick}
      onContextMenu={(e) => onContextMenu(file, e)}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDragEnd={onDragEnd}
      onDrop={handleDrop}
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
        style={{ color: selected ? colors.textHighlight : colors.text }}
      >
        {file.name}
      </span>
      
      <button
        className={styles.moreButton}
        onClick={(e) => {
          e.stopPropagation();
          onContextMenu(file, e);
        }}
      >
        <MoreVertical size={14} color={colors.textSecondary} />
      </button>
    </div>
  );
};

export default DraggableFileItem;