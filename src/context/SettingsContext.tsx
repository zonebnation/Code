import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import SettingsSyncService from '../services/SettingsSyncService';

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
  updateFontSize: (size: number) => void;
  updateTabSize: (size: number) => void;
  updateUseTabs: (useTabs: boolean) => void;
  updateWordWrap: (wordWrap: boolean) => void;
  updateAutoSave: (autoSave: boolean) => void;
  updateMinimapEnabled: (enabled: boolean) => void;
  updateColorTheme: (theme: ColorTheme) => void;
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
  updateFontSize: () => {},
  updateTabSize: () => {},
  updateUseTabs: () => {},
  updateWordWrap: () => {},
  updateAutoSave: () => {},
  updateMinimapEnabled: () => {},
  updateColorTheme: () => {},
  syncStatus: 'idle',
  lastSyncTime: null,
  syncSettings: async () => {},
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const { user } = useAuth();
  const [editorSettings, setEditorSettings] = useState<EditorSettings>(defaultSettings);
  const [colorTheme, setColorTheme] = useState<ColorTheme>('default');
  const [isDark, setIsDark] = useState(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [syncInitialized, setSyncInitialized] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadLocalSettings = () => {
      const savedSettings = localStorage.getItem('codeCanvas_editorSettings');
      const savedTheme = localStorage.getItem('codeCanvas_colorTheme');
      const savedDarkMode = localStorage.getItem('codeCanvas_darkMode');
      
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
          
          // Add default values for new settings if they don't exist
          if (parsedSettings.minimapEnabled === undefined) {
            parsedSettings.minimapEnabled = defaultSettings.minimapEnabled;
          }
          
          setEditorSettings(parsedSettings);
        } catch (e) {
          console.error('Failed to parse saved editor settings', e);
        }
      }
      
      if (savedTheme) {
        setColorTheme(savedTheme as ColorTheme);
      }
      
      if (savedDarkMode !== null) {
        setIsDark(savedDarkMode === 'true');
      }
    };

    loadLocalSettings();
  }, []);

  // Set up sync status listener
  useEffect(() => {
    const handleSyncStatusChange = (status: 'idle' | 'syncing' | 'error' | 'success') => {
      setSyncStatus(status);
    };

    SettingsSyncService.onSyncStatusChange(handleSyncStatusChange);
    
    return () => {
      SettingsSyncService.offSyncStatusChange(handleSyncStatusChange);
    };
  }, []);

  // Try to load settings from server when user logs in
  useEffect(() => {
    const loadSyncedSettings = async () => {
      if (!user || syncInitialized) return;
      
      try {
        // Check if sync is enabled
        const syncEnabled = await SettingsSyncService.isSyncEnabled();
        
        if (!syncEnabled) {
          setSyncInitialized(true);
          return;
        }

        // Get remote settings
        const remoteSettings = await SettingsSyncService.loadAllSettings();
        
        // If we have remote settings, apply them
        if (remoteSettings) {
          if (remoteSettings.editorSettings) {
            setEditorSettings(remoteSettings.editorSettings);
          }
          
          if (remoteSettings.colorTheme) {
            setColorTheme(remoteSettings.colorTheme);
          }
          
          if (remoteSettings.isDark !== undefined) {
            setIsDark(remoteSettings.isDark);
          }
          
          setLastSyncTime(remoteSettings.lastSyncTime || Date.now());
        }
        
        setSyncInitialized(true);
      } catch (error) {
        console.error('Error loading synced settings:', error);
        setSyncInitialized(true);
      }
    };

    loadSyncedSettings();
  }, [user, syncInitialized]);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('codeCanvas_editorSettings', JSON.stringify(editorSettings));
  }, [editorSettings]);

  // Save theme when it changes
  useEffect(() => {
    localStorage.setItem('codeCanvas_colorTheme', colorTheme);
  }, [colorTheme]);

  // Save dark mode preference when it changes
  useEffect(() => {
    localStorage.setItem('codeCanvas_darkMode', String(isDark));
    
    // Update body class for global CSS
    if (isDark) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }, [isDark]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if the user hasn't explicitly set a preference
      if (!localStorage.getItem('codeCanvas_darkMode')) {
        setIsDark(e.matches);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

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

  // Sync current settings to the server
  const syncSettings = async (): Promise<void> => {
    if (!user) return;

    try {
      setSyncStatus('syncing');
      
      // Get settings object
      const settings = {
        editorSettings,
        colorTheme,
        isDark,
        lastSyncTime: Date.now()
      };
      
      // Upload to server
      const result = await SettingsSyncService.saveAllSettings(settings);
      
      if (result.success) {
        setLastSyncTime(result.timestamp || Date.now());
        setSyncStatus('success');
      } else {
        setSyncStatus('error');
      }
    } catch (error) {
      console.error('Error syncing settings:', error);
      setSyncStatus('error');
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        editorSettings,
        colorTheme,
        isDark,
        updateFontSize,
        updateTabSize,
        updateUseTabs,
        updateWordWrap,
        updateAutoSave,
        updateMinimapEnabled,
        updateColorTheme,
        syncStatus,
        lastSyncTime,
        syncSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};