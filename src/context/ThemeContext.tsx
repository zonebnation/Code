import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  ThemeColors, 
  lightColors, 
  darkColors,
  highContrastDarkColors,
  sepiaColors,
  midnightBlueColors,
  materialDarkColors
} from '../constants/colors';
import { useSettings } from './SettingsContext';

export type ThemeName = 'light' | 'dark' | 'highContrastDark' | 'sepia' | 'midnightBlue' | 'materialDark';

type ThemeContextType = {
  isDark: boolean;
  toggleTheme: () => void;
  colors: ThemeColors;
  themeName: ThemeName;
  setTheme: (theme: ThemeName) => void;
  availableThemes: { id: ThemeName; name: string; isDark: boolean; }[];
};

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {},
  colors: lightColors,
  themeName: 'light',
  setTheme: () => {},
  availableThemes: [],
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use browser preferences for initial theme
  const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Load theme from local storage if available, or use system preference
  const storedTheme = localStorage.getItem('codeCanvas_themeName') as ThemeName | null;
  const initialTheme = storedTheme || (systemPrefersDark ? 'dark' : 'light');
  
  const [themeName, setThemeName] = useState<ThemeName>(initialTheme);
  
  const availableThemes = [
    { id: 'light' as ThemeName, name: 'Light', isDark: false },
    { id: 'dark' as ThemeName, name: 'Dark', isDark: true },
    { id: 'highContrastDark' as ThemeName, name: 'High Contrast Dark', isDark: true },
    { id: 'sepia' as ThemeName, name: 'Sepia', isDark: false },
    { id: 'midnightBlue' as ThemeName, name: 'Midnight Blue', isDark: true },
    { id: 'materialDark' as ThemeName, name: 'Material Dark', isDark: true },
  ];

  // Check if theme is dark
  const isDark = availableThemes.find(t => t.id === themeName)?.isDark || false;

  // Get colors for current theme
  const getThemeColors = (): ThemeColors => {
    switch (themeName) {
      case 'light':
        return lightColors;
      case 'dark':
        return darkColors;
      case 'highContrastDark':
        return highContrastDarkColors;
      case 'sepia':
        return sepiaColors;
      case 'midnightBlue':
        return midnightBlueColors;
      case 'materialDark':
        return materialDarkColors;
      default:
        return isDark ? darkColors : lightColors;
    }
  };

  const colors = getThemeColors();

  // Update document when theme changes
  useEffect(() => {
    // Save theme preference
    localStorage.setItem('codeCanvas_themeName', themeName);
    
    // Update document classes
    document.body.classList.remove(
      'light-theme', 
      'dark-theme', 
      'high-contrast-theme', 
      'sepia-theme',
      'midnight-theme',
      'material-theme'
    );
    
    // Apply theme class
    switch (themeName) {
      case 'light':
        document.body.classList.add('light-theme');
        break;
      case 'dark':
        document.body.classList.add('dark-theme');
        break;
      case 'highContrastDark':
        document.body.classList.add('high-contrast-theme');
        document.body.classList.add('dark-theme');
        break;
      case 'sepia':
        document.body.classList.add('sepia-theme');
        break;
      case 'midnightBlue':
        document.body.classList.add('midnight-theme');
        document.body.classList.add('dark-theme');
        break;
      case 'materialDark':
        document.body.classList.add('material-theme');
        document.body.classList.add('dark-theme');
        break;
    }
    
    // Apply CSS variables for theme colors
    Object.entries(colors).forEach(([key, value]) => {
      if (typeof value === 'string') {
        document.documentElement.style.setProperty(`--color-${key}`, value);
      }
    });
    
    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', colors.background);
    }
  }, [themeName, colors]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if the user hasn't explicitly set a preference
      if (!localStorage.getItem('codeCanvas_themeName')) {
        setThemeName(e.matches ? 'dark' : 'light');
      }
    };
    
    try {
      // Modern browsers
      mediaQuery.addEventListener('change', handleChange);
    } catch (err) {
      // Safari and older browsers
      mediaQuery.addListener(handleChange);
    }
    
    return () => {
      try {
        // Modern browsers
        mediaQuery.removeEventListener('change', handleChange);
      } catch (err) {
        // Safari and older browsers
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  const toggleTheme = () => {
    setThemeName(isDark ? 'light' : 'dark');
  };

  const setTheme = (theme: ThemeName) => {
    setThemeName(theme);
  };

  return (
    <ThemeContext.Provider value={{ 
      isDark, 
      toggleTheme, 
      colors, 
      themeName, 
      setTheme,
      availableThemes 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};