export type ThemeColors = {
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
  textHighlight: string;
  selectedItem: string;
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

export const lightColors: ThemeColors = {
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
  textHighlight: '#0078D7',
  selectedItem: 'rgba(0, 120, 215, 0.1)',
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

export const darkColors: ThemeColors = {
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
  textHighlight: '#3794FF',
  selectedItem: 'rgba(55, 148, 255, 0.2)',
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

// High contrast dark theme
export const highContrastDarkColors: ThemeColors = {
  primary: '#4AEAFF', // Brighter blue
  secondary: '#5AF5CA',
  accent: '#FF9CD6',
  success: '#7EFF5A',
  warning: '#FFF04A',
  error: '#FF7E7E',
  background: '#000000',
  surface: '#1A1A1A',
  border: '#444444',
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textHighlight: '#4AEAFF',
  selectedItem: 'rgba(74, 234, 255, 0.3)',
  tabBarActive: '#4AEAFF',
  tabBarInactive: '#CCCCCC',
  codeBackground: '#000000',
  codeSyntax: {
    keyword: '#78D7FF',
    string: '#FFA0A0',
    comment: '#7CD47C',
    function: '#FFFF7C',
    variable: '#C4E7FF',
    number: '#D4FFAA',
    operator: '#FFFFFF',
    property: '#78FFFF',
  },
};

// Sepia/Paper theme
export const sepiaColors: ThemeColors = {
  primary: '#8B5A2B',
  secondary: '#7D5C3C',
  accent: '#A45A52',
  success: '#4D724D',
  warning: '#B2852F',
  error: '#A95151',
  background: '#F4ECD8',
  surface: '#FBF6E9',
  border: '#D8C9AB',
  text: '#52443B',
  textSecondary: '#7A6A56',
  textHighlight: '#8B5A2B',
  selectedItem: 'rgba(139, 90, 43, 0.15)',
  tabBarActive: '#8B5A2B',
  tabBarInactive: '#7A6A56',
  codeBackground: '#F2ECDA',
  codeSyntax: {
    keyword: '#7C552B',
    string: '#A04D3C',
    comment: '#6F7741',
    function: '#6A563D',
    variable: '#7B5C3D',
    number: '#7D6A42',
    operator: '#52443B',
    property: '#7C562C',
  },
};

// Midnight blue theme
export const midnightBlueColors: ThemeColors = {
  primary: '#5B8BF6',
  secondary: '#50B5CF',
  accent: '#A45DE6',
  success: '#5CCF7A',
  warning: '#E6BE30',
  error: '#E65A5A',
  background: '#0F172A',
  surface: '#1E293B',
  border: '#334155',
  text: '#E2E8F0',
  textSecondary: '#94A3B8',
  textHighlight: '#5B8BF6',
  selectedItem: 'rgba(91, 139, 246, 0.2)',
  tabBarActive: '#5B8BF6',
  tabBarInactive: '#94A3B8',
  codeBackground: '#0F172A',
  codeSyntax: {
    keyword: '#5B8BF6',
    string: '#E6BE30',
    comment: '#64748B',
    function: '#50B5CF',
    variable: '#A45DE6',
    number: '#5CCF7A',
    operator: '#E2E8F0',
    property: '#50B5CF',
  },
};

// Material dark theme
export const materialDarkColors: ThemeColors = {
  primary: '#BB86FC',
  secondary: '#03DAC6',
  accent: '#CF6679',
  success: '#4CAF50',
  warning: '#FB8C00',
  error: '#CF6679',
  background: '#121212',
  surface: '#1E1E1E',
  border: '#2C2C2C',
  text: '#E1E1E1',
  textSecondary: '#B0B0B0',
  textHighlight: '#BB86FC',
  selectedItem: 'rgba(187, 134, 252, 0.2)',
  tabBarActive: '#BB86FC',
  tabBarInactive: '#B0B0B0',
  codeBackground: '#121212',
  codeSyntax: {
    keyword: '#BB86FC',
    string: '#03DAC6',
    comment: '#6A737D',
    function: '#82AAFF',
    variable: '#F78C6C',
    number: '#F78C6C',
    operator: '#E1E1E1',
    property: '#03DAC6',
  },
};