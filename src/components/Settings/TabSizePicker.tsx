import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Check, ChevronDown } from 'lucide-react';
import styles from './TabSizePicker.module.css';

interface TabSizePickerProps {
  value: number;
  onChange: (size: number) => void;
}

const TabSizePicker: React.FC<TabSizePickerProps> = ({
  value,
  onChange
}) => {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const tabSizes = [2, 4, 8];
  
  // Calculate dropdown position
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownStyle({
        top: rect.bottom + 5,
        left: rect.left,
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) && 
        containerRef.current && 
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        className={styles.pickerButton}
        style={{ backgroundColor: colors.background, borderColor: colors.border }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ color: colors.text }}>{value} spaces</span>
        <ChevronDown size={16} color={colors.textSecondary} />
      </button>

      {isOpen && (
        <div 
          className={styles.dropdown}
          style={{ 
            ...dropdownStyle,
            backgroundColor: colors.surface, 
            borderColor: colors.border 
          }}
          ref={dropdownRef}
        >
          <div className={styles.sizeList}>
            {tabSizes.map(size => (
              <button
                key={size}
                className={styles.sizeItem}
                style={{ borderBottomColor: colors.border }}
                onClick={() => {
                  onChange(size);
                  setIsOpen(false);
                }}
              >
                <span style={{ color: colors.text }}>{size} spaces</span>
                {value === size && (
                  <Check size={16} color={colors.primary} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TabSizePicker;