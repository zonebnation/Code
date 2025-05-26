import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { ChevronDown } from 'lucide-react';
import styles from './FontSizePicker.module.css';

interface FontSizePickerProps {
  value: number;
  onChange: (size: number) => void;
  min?: number;
  max?: number;
}

const FontSizePicker: React.FC<FontSizePickerProps> = ({
  value,
  onChange,
  min = 10,
  max = 24
}) => {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [tempValue, setTempValue] = useState(value.toString());
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Common font sizes
  const fontSizes = [10, 12, 14, 16, 18, 20, 24];

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

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTempValue(val);
    
    const numValue = parseInt(val, 10);
    if (isNaN(numValue)) {
      setError('Please enter a valid number');
    } else if (numValue < min) {
      setError(`Minimum size is ${min}`);
    } else if (numValue > max) {
      setError(`Maximum size is ${max}`);
    } else {
      setError(null);
    }
  };

  const handleApply = () => {
    const numValue = parseInt(tempValue, 10);
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      onChange(numValue);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleApply();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        className={styles.pickerButton}
        style={{ backgroundColor: colors.background, borderColor: colors.border }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ color: colors.text }}>{value}px</span>
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
          <div className={styles.presetSizes}>
            {fontSizes.map(size => (
              <button
                key={size}
                className={styles.sizeOption}
                style={{ 
                  backgroundColor: size === value ? colors.primary : 'transparent',
                  color: size === value ? '#FFFFFF' : colors.text
                }}
                onClick={() => {
                  onChange(size);
                  setIsOpen(false);
                }}
              >
                {size}px
              </button>
            ))}
          </div>

          <div className={styles.customSizeSection}>
            <div className={styles.customSizeLabel} style={{ color: colors.textSecondary }}>
              Custom size:
            </div>
            <div className={styles.customSizeInput}>
              <input
                type="number"
                min={min}
                max={max}
                value={tempValue}
                onChange={handleCustomChange}
                onKeyDown={handleKeyDown}
                style={{ 
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  color: colors.text,
                  minHeight: '32px'
                }}
              />
              <button
                className={styles.applyButton}
                style={{ backgroundColor: colors.primary }}
                onClick={handleApply}
                disabled={!!error}
              >
                Apply
              </button>
            </div>
            {error && <div className={styles.error} style={{ color: colors.error }}>{error}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default FontSizePicker;