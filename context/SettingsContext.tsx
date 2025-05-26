import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type EditorSettings = {
  fontSize: number;
  tabSize: number;
  useTabs: boolean;
  wordWrap: boolean;
  autoSave: boolean;
};

export type ColorTheme = 'default' | 'github' | 'monokai' | 'solarized';

interface SettingsContextType {
  editorSettings: EditorSettings;
  colorTheme: ColorTheme;
  updateFontSize: (size: number) => void;
  updateTabSize: (size: number) => void;
  updateUseTabs: (useTabs: boolean) => void;
  updateWordWrap: (wordWrap: boolean) => void;
  updateAutoSave: (autoSave: boolean) => void;
  updateColorTheme: (theme: ColorTheme) => void;
}

const defaultSettings: EditorSettings = {
  fontSize: 14,
  tabSize: 2,
  useTabs: false,
  wordWrap: true,
  autoSave: true,
};

const SettingsContext = createContext<SettingsContextType>({
  editorSettings: defaultSettings,
  colorTheme: 'default',
  updateFontSize: () => {},
  updateTabSize: () => {},
  updateUseTabs: () => {},
  updateWordWrap: () => {},
  updateAutoSave: () => {},
  updateColorTheme: () => {},
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [editorSettings, setEditorSettings] = useState<EditorSettings>(defaultSettings);
  const [colorTheme, setColorTheme] = useState<ColorTheme>('default');

  // Load settings from storage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem('codeCanvas_editorSettings');
        const savedTheme = await AsyncStorage.getItem('codeCanvas_colorTheme');
        
        if (savedSettings) {
          setEditorSettings(JSON.parse(savedSettings));
        }
        
        if (savedTheme) {
          setColorTheme(savedTheme as ColorTheme);
        }
      } catch (e) {
        console.error('Failed to load settings', e);
      }
    };

    loadSettings();
  }, []);

  // Save settings when they change
  useEffect(() => {
    const saveSettings = async () => {
      try {
        await AsyncStorage.setItem('codeCanvas_editorSettings', JSON.stringify(editorSettings));
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
        await AsyncStorage.setItem('codeCanvas_colorTheme', colorTheme);
      } catch (e) {
        console.error('Failed to save theme', e);
      }
    };

    saveTheme();
  }, [colorTheme]);

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

  const updateColorTheme = (theme: ColorTheme) => {
    setColorTheme(theme);
  };

  return (
    <SettingsContext.Provider
      value={{
        editorSettings,
        colorTheme,
        updateFontSize,
        updateTabSize,
        updateUseTabs,
        updateWordWrap,
        updateAutoSave,
        updateColorTheme,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};