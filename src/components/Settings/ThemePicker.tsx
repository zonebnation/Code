import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Check, ChevronDown } from 'lucide-react';
import { ColorTheme } from '../../context/SettingsContext';
import styles from './ThemePicker.module.css';

interface ThemePickerProps {
  value: ColorTheme;
  onChange: (theme: ColorTheme) => void;
  isDark: boolean;
}

const ThemePicker: React.FC<ThemePickerProps> = ({
  value,
  onChange,
  isDark
}) => {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const themes = [
    { 
      id: 'default', 
      name: isDark ? 'Dark+' : 'Light+', 
      description: 'The default Code Canvas theme' 
    },
    { 
      id: 'github', 
      name: isDark ? 'GitHub Dark' : 'GitHub Light', 
      description: 'Based on GitHub\'s coding theme' 
    },
    { 
      id: 'monokai', 
      name: 'Monokai', 
      description: 'Classic dark theme with vibrant colors' 
    },
    { 
      id: 'solarized', 
      name: isDark ? 'Solarized Dark' : 'Solarized Light', 
      description: 'Eye-friendly color scheme' 
    }
  ];

  const currentTheme = themes.find(t => t.id === value) || themes[0];

  // Calculate dropdown position
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownStyle({
        top: rect.bottom + 5,
        left: Math.max(0, rect.left - 120), // Adjust to prevent overflow on small screens
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

    // Close on escape key
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        className={styles.pickerButton}
        style={{ backgroundColor: colors.background, borderColor: colors.border }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ color: colors.text }}>{currentTheme.name}</span>
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
          <div className={styles.themeList}>
            {themes.map(theme => (
              <button
                key={theme.id}
                className={styles.themeItem}
                style={{ borderBottomColor: colors.border }}
                onClick={() => {
                  onChange(theme.id as ColorTheme);
                  setIsOpen(false);
                }}
              >
                <div className={styles.themeInfo}>
                  <div className={styles.themeName} style={{ color: colors.text }}>
                    {theme.name}
                  </div>
                  <div className={styles.themeDescription} style={{ color: colors.textSecondary }}>
                    {theme.description}
                  </div>
                </div>
                {value === theme.id && (
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

export default ThemePicker;