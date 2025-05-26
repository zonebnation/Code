import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeColors = {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  background: string;
  surface: string;
  border: string;
  text: string;
  textSecondary: string;
  tabBarActive: string;
  tabBarInactive: string;
  codeBackground: string;
  codeSyntax: {
    keyword: string;
    string: string;
    comment: string;
    function: string;
    variable: string;
    number: string;
    operator: string;
    property: string;
  };
};

const lightColors: ThemeColors = {
  primary: '#0078D7',
  secondary: '#3F9142',
  accent: '#9C27B0',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  border: '#E2E2E2',
  text: '#171717',
  textSecondary: '#737373',
  tabBarActive: '#0078D7',
  tabBarInactive: '#737373',
  codeBackground: '#F8F8F8',
  codeSyntax: {
    keyword: '#0000FF',
    string: '#A31515',
    comment: '#008000',
    function: '#795E26',
    variable: '#1F377F',
    number: '#098658',
    operator: '#000000',
    property: '#0070C1',
  },
};

const darkColors: ThemeColors = {
  primary: '#3794FF',
  secondary: '#4EC9B0',
  accent: '#C586C0',
  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#F87171',
  background: '#1E1E1E',
  surface: '#252526',
  border: '#3E3E42',
  text: '#CCCCCC',
  textSecondary: '#9D9D9D',
  tabBarActive: '#3794FF',
  tabBarInactive: '#9D9D9D',
  codeBackground: '#1E1E1E',
  codeSyntax: {
    keyword: '#569CD6',
    string: '#CE9178',
    comment: '#6A9955',
    function: '#DCDCAA',
    variable: '#9CDCFE',
    number: '#B5CEA8',
    operator: '#D4D4D4',
    property: '#4EC9B0',
  },
};

type ThemeContextType = {
  isDark: boolean;
  toggleTheme: () => void;
  colors: ThemeColors;
};

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {},
  colors: lightColors,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use browser preferences for initial theme
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const [isDark, setIsDark] = useState(prefersDark);

  // Update theme when system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Update document when theme changes
  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};