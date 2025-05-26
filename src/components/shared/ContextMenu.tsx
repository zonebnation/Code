import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import styles from './ContextMenu.module.css';

interface ContextMenuItem {
  id: string;
  label: string;
  icon: JSX.Element;
  action: () => void;
  divider?: boolean;
}

interface ContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ visible, x, y, items, onClose }) => {
  const { colors } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Adjust position to prevent menu from going offscreen
  const [adjustedPosition, setAdjustedPosition] = useState<{ x: number; y: number }>({ x, y });
  
  useEffect(() => {
    if (visible && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let adjustedX = x;
      let adjustedY = y;
      
      // Adjust horizontal position if menu would go off right edge
      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }
      
      // Adjust vertical position if menu would go off bottom edge
      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }
      
      setAdjustedPosition({ x: adjustedX, y: adjustedY });
    }
  }, [visible, x, y]);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [visible, onClose]);
  
  // Close menu when pressing Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    if (visible) {
      document.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible, onClose]);
  
  if (!visible) return null;
  
  return (
    <div 
      ref={menuRef}
      className={styles.menu}
      style={{
        top: adjustedPosition.y,
        left: adjustedPosition.x,
        backgroundColor: colors.surface,
        borderColor: colors.border,
      }}
    >
      {items.map((item) => 
        item.divider ? (
          <div 
            key={item.id} 
            className={styles.divider}
            style={{ backgroundColor: colors.border }}
          />
        ) : (
          <button
            key={item.id}
            className={styles.item}
            onClick={() => {
              item.action();
              onClose();
            }}
          >
            <div className={styles.icon}>{item.icon}</div>
            <span className={styles.label} style={{ color: colors.text }}>{item.label}</span>
          </button>
        )
      )}
    </div>
  );
};

export default ContextMenu;