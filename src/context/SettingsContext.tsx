import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeName } from './ThemeContext';

export type EditorSettings = {
  fontSize: number;
  tabSize: number;
  useTabs: boolean;
  wordWrap: boolean;
  autoSave: boolean;
  minimapEnabled: boolean;
};

export type ColorTheme = 'default' | 'github' | 'monokai' | 'solarized';

interface SettingsContextType {
  editorSettings: EditorSettings;
  colorTheme: ColorTheme;
  isDark: boolean;
  themeName: ThemeName;
  updateFontSize: (size: number) => void;
  updateTabSize: (size: number) => void;
  updateUseTabs: (useTabs: boolean) => void;
  updateWordWrap: (wordWrap: boolean) => void;
  updateAutoSave: (autoSave: boolean) => void;
  updateMinimapEnabled: (enabled: boolean) => void;
  updateColorTheme: (theme: ColorTheme) => void;
  updateThemeName: (theme: ThemeName) => void;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
  lastSyncTime: number | null;
  syncSettings: () => Promise<void>;
}

const defaultSettings: EditorSettings = {
  fontSize: 14,
  tabSize: 2,
  useTabs: false,
  wordWrap: true,
  autoSave: true,
  minimapEnabled: true
};

const SettingsContext = createContext<SettingsContextType>({
  editorSettings: defaultSettings,
  colorTheme: 'default',
  isDark: false,
  themeName: 'dark',
  updateFontSize: () => {},
  updateTabSize: () => {},
  updateUseTabs: () => {},
  updateWordWrap: () => {},
  updateAutoSave: () => {},
  updateMinimapEnabled: () => {},
  updateColorTheme: () => {},
  updateThemeName: () => {},
  syncStatus: 'idle',
  lastSyncTime: null,
  syncSettings: async () => {},
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [editorSettings, setEditorSettings] = useState<EditorSettings>(defaultSettings);
  const [colorTheme, setColorTheme] = useState<ColorTheme>('default');
  const [isDark, setIsDark] = useState(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [themeName, setThemeName] = useState<ThemeName>('dark');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [syncInitialized, setSyncInitialized] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadLocalSettings = async () => {
      try {
        const savedSettings = localStorage.getItem('codeCanvas_editorSettings');
        const savedTheme = localStorage.getItem('codeCanvas_colorTheme');
        const savedDarkMode = localStorage.getItem('codeCanvas_darkMode');
        const savedThemeName = localStorage.getItem('codeCanvas_themeName');
        
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          
          // Add default values for new settings if they don't exist
          if (parsedSettings.minimapEnabled === undefined) {
            parsedSettings.minimapEnabled = defaultSettings.minimapEnabled;
          }
          
          setEditorSettings(parsedSettings);
        }
        
        if (savedTheme) {
          setColorTheme(savedTheme as ColorTheme);
        }
        
        if (savedDarkMode !== null) {
          setIsDark(savedDarkMode === 'true');
        }
        
        if (savedThemeName) {
          setThemeName(savedThemeName as ThemeName);
        }
      } catch (e) {
        console.error('Failed to load settings', e);
      }
    };

    loadLocalSettings();
  }, []);

  // Save settings when they change
  useEffect(() => {
    const saveSettings = async () => {
      try {
        localStorage.setItem('codeCanvas_editorSettings', JSON.stringify(editorSettings));
      } catch (e) {
        console.error('Failed to save settings', e);
      }
    };

    saveSettings();
  }, [editorSettings]);

  // Save theme when it changes
  useEffect(() => {
    const saveTheme = async () => {
      try {
        localStorage.setItem('codeCanvas_colorTheme', colorTheme);
      } catch (e) {
        console.error('Failed to save theme', e);
      }
    };

    saveTheme();
  }, [colorTheme]);

  // Save dark mode preference when it changes
  useEffect(() => {
    const saveDarkMode = async () => {
      try {
        localStorage.setItem('codeCanvas_darkMode', String(isDark));
      } catch (e) {
        console.error('Failed to save dark mode preference', e);
      }
    };

    saveDarkMode();
  }, [isDark]);
  
  // Save theme name when it changes
  useEffect(() => {
    const saveThemeName = async () => {
      try {
        localStorage.setItem('codeCanvas_themeName', themeName);
      } catch (e) {
        console.error('Failed to save theme name', e);
      }
    };

    saveThemeName();
  }, [themeName]);

  const updateFontSize = (size: number) => {
    setEditorSettings(prev => ({ ...prev, fontSize: size }));
  };

  const updateTabSize = (size: number) => {
    setEditorSettings(prev => ({ ...prev, tabSize: size }));
  };

  const updateUseTabs = (useTabs: boolean) => {
    setEditorSettings(prev => ({ ...prev, useTabs }));
  };

  const updateWordWrap = (wordWrap: boolean) => {
    setEditorSettings(prev => ({ ...prev, wordWrap }));
  };

  const updateAutoSave = (autoSave: boolean) => {
    setEditorSettings(prev => ({ ...prev, autoSave }));
  };

  const updateMinimapEnabled = (enabled: boolean) => {
    setEditorSettings(prev => ({ ...prev, minimapEnabled: enabled }));
  };

  const updateColorTheme = (theme: ColorTheme) => {
    setColorTheme(theme);
  };
  
  const updateThemeName = (theme: ThemeName) => {
    setThemeName(theme);
    // Also update isDark based on the selected theme
    const isDarkTheme = ['dark', 'highContrastDark', 'midnightBlue', 'materialDark'].includes(theme);
    setIsDark(isDarkTheme);
  };

  // Sync current settings to the server
  const syncSettings = async (): Promise<void> => {
    // This is a placeholder for syncing settings with the server
    try {
      setSyncStatus('syncing');
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get settings object to sync
      const settings = {
        editorSettings,
        colorTheme,
        isDark,
        themeName,
        lastSyncTime: Date.now()
      };
      
      // In a real implementation, this would call an API to save settings
      console.log('Syncing settings:', settings);
      
      setLastSyncTime(Date.now());
      setSyncStatus('success');
      
      // Reset success status after 3 seconds
      setTimeout(() => {
        setSyncStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Error syncing settings:', error);
      setSyncStatus('error');
      
      // Reset error status after 3 seconds
      setTimeout(() => {
        setSyncStatus('idle');
      }, 3000);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        editorSettings,
        colorTheme,
        isDark,
        themeName,
        updateFontSize,
        updateTabSize,
        updateUseTabs,
        updateWordWrap,
        updateAutoSave,
        updateMinimapEnabled,
        updateColorTheme,
        updateThemeName,
        syncStatus,
        lastSyncTime,
        syncSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};