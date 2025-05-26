import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useSettings, ColorTheme } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { 
  ChevronRight, 
  Moon, 
  Sun, 
  Code, 
  Palette, 
  Zap, 
  Info, 
  Type, 
  AlignJustify, 
  Indent, 
  User, 
  LogOut, 
  WifiOff, 
  Map,
  Keyboard,
  Cloud
} from 'lucide-react';
import FontSizePicker from '../components/Settings/FontSizePicker';
import ThemePicker from '../components/Settings/ThemePicker';
import TabSizePicker from '../components/Settings/TabSizePicker';
import OfflineSettings from '../components/Settings/OfflineSettings';
import EditorSettings from '../components/Settings/EditorSettings';
import KeyBindingsConfig from '../components/Settings/KeyBindingsConfig';
import SettingsSync from '../components/Settings/SettingsSync';
import { useNavigate, Route, Routes } from 'react-router-dom';
import styles from './SettingsScreen.module.css';
import ProfileForm from '../components/Auth/ProfileForm';

const ProfileSettings = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  
  return (
    <div 
      className={styles.container}
      style={{ backgroundColor: colors.background }}
    >
      <div 
        className={styles.header}
        style={{ borderBottomColor: colors.border }}
      >
        <button 
          className={styles.backButton} 
          onClick={() => navigate('/settings')}
          aria-label="Back to settings"
        >
          <ChevronRight size={20} color={colors.primary} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <h2 className={styles.headerTitle} style={{ color: colors.text }}>Profile</h2>
      </div>
      
      <div className={styles.content}>
        <ProfileForm />
      </div>
    </div>
  );
};

const OfflineSettingsScreen = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  
  return (
    <div 
      className={styles.container}
      style={{ backgroundColor: colors.background }}
    >
      <div 
        className={styles.header}
        style={{ borderBottomColor: colors.border }}
      >
        <button 
          className={styles.backButton} 
          onClick={() => navigate('/settings')}
          aria-label="Back to settings"
        >
          <ChevronRight size={20} color={colors.primary} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <h2 className={styles.headerTitle} style={{ color: colors.text }}>Offline Mode</h2>
      </div>
      
      <div className={styles.content}>
        <OfflineSettings />
      </div>
    </div>
  );
};

const EditorSettingsScreen = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  
  return (
    <div 
      className={styles.container}
      style={{ backgroundColor: colors.background }}
    >
      <div 
        className={styles.header}
        style={{ borderBottomColor: colors.border }}
      >
        <button 
          className={styles.backButton} 
          onClick={() => navigate('/settings')}
          aria-label="Back to settings"
        >
          <ChevronRight size={20} color={colors.primary} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <h2 className={styles.headerTitle} style={{ color: colors.text }}>Editor Settings</h2>
      </div>
      
      <div className={styles.content}>
        <EditorSettings />
      </div>
    </div>
  );
};

const KeyboardSettingsScreen = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  
  return (
    <div 
      className={styles.container}
      style={{ backgroundColor: colors.background }}
    >
      <div 
        className={styles.header}
        style={{ borderBottomColor: colors.border }}
      >
        <button 
          className={styles.backButton} 
          onClick={() => navigate('/settings')}
          aria-label="Back to settings"
        >
          <ChevronRight size={20} color={colors.primary} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <h2 className={styles.headerTitle} style={{ color: colors.text }}>Keyboard Shortcuts</h2>
      </div>
      
      <div className={styles.content}>
        <KeyBindingsConfig />
      </div>
    </div>
  );
};

const SyncSettingsScreen = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  
  return (
    <div 
      className={styles.container}
      style={{ backgroundColor: colors.background }}
    >
      <div 
        className={styles.header}
        style={{ borderBottomColor: colors.border }}
      >
        <button 
          className={styles.backButton} 
          onClick={() => navigate('/settings')}
          aria-label="Back to settings"
        >
          <ChevronRight size={20} color={colors.primary} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <h2 className={styles.headerTitle} style={{ color: colors.text }}>Settings Sync</h2>
      </div>
      
      <div className={styles.content}>
        <SettingsSync />
      </div>
    </div>
  );
};

const AboutScreen = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  
  return (
    <div 
      className={styles.container}
      style={{ backgroundColor: colors.background }}
    >
      <div 
        className={styles.header}
        style={{ borderBottomColor: colors.border }}
      >
        <button 
          className={styles.backButton} 
          onClick={() => navigate('/settings')}
          aria-label="Back to settings"
        >
          <ChevronRight size={20} color={colors.primary} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <h2 className={styles.headerTitle} style={{ color: colors.text }}>About</h2>
      </div>
      
      <div className={styles.content} style={{ padding: '20px' }}>
        <div style={{ backgroundColor: colors.surface, padding: '24px', borderRadius: '12px', maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ color: colors.primary, marginBottom: '16px', fontSize: '24px', textAlign: 'center' }}>Code Canvas</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3 style={{ color: colors.text, fontSize: '18px', marginBottom: '8px' }}>Version</h3>
              <p style={{ color: colors.textSecondary }}>1.2.0 (2025)</p>
            </div>
            
            <div>
              <h3 style={{ color: colors.text, fontSize: '18px', marginBottom: '8px' }}>About</h3>
              <p style={{ color: colors.textSecondary, lineHeight: 1.6 }}>
                Code Canvas is a versatile coding environment designed for both beginners and professionals. 
                It provides an integrated experience for writing, testing, and sharing code across multiple platforms.
              </p>
            </div>
            
            <div>
              <h3 style={{ color: colors.text, fontSize: '18px', marginBottom: '8px' }}>Features</h3>
              <ul style={{ color: colors.textSecondary, paddingLeft: '20px' }}>
                <li>Advanced code editor with syntax highlighting</li>
                <li>Integrated terminal</li>
                <li>File explorer and project management</li>
                <li>Real-time collaboration</li>
                <li>Cloud sync across devices</li>
                <li>Offline support</li>
              </ul>
            </div>
            
            <div>
              <h3 style={{ color: colors.text, fontSize: '18px', marginBottom: '8px' }}>Support</h3>
              <p style={{ color: colors.textSecondary }}>
                For help and support, contact us at support@codecanvas.dev
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AppearanceScreen = () => {
  const { colors, isDark, toggleTheme } = useTheme();
  const { colorTheme, updateColorTheme } = useSettings();
  const navigate = useNavigate();
  
  return (
    <div 
      className={styles.container}
      style={{ backgroundColor: colors.background }}
    >
      <div 
        className={styles.header}
        style={{ borderBottomColor: colors.border }}
      >
        <button 
          className={styles.backButton} 
          onClick={() => navigate('/settings')}
          aria-label="Back to settings"
        >
          <ChevronRight size={20} color={colors.primary} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <h2 className={styles.headerTitle} style={{ color: colors.text }}>Appearance</h2>
      </div>
      
      <div className={styles.content}>
        <div style={{ padding: '16px' }}>
          <div style={{ 
            marginBottom: '24px', 
            backgroundColor: colors.surface,
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            {/* Dark Theme Toggle */}
            <div 
              className={styles.settingItem}
              style={{ borderBottomColor: colors.border }}
            >
              <div className={styles.settingIcon}>
                {isDark ? 
                  <Moon size={20} color={colors.primary} /> : 
                  <Sun size={20} color={colors.primary} />
                }
              </div>
              
              <div className={styles.settingContent}>
                <span 
                  className={styles.settingTitle}
                  style={{ color: colors.text }}
                >
                  Dark Theme
                </span>
                
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={isDark}
                    onChange={toggleTheme}
                  />
                  <span 
                    className={styles.slider}
                    style={{ backgroundColor: isDark ? colors.primary : colors.border }}
                  ></span>
                </label>
              </div>
            </div>
            
            {/* Theme Picker */}
            <div 
              className={styles.settingItem}
              style={{ borderBottomColor: colors.border }}
            >
              <div className={styles.settingIcon}>
                <Palette size={20} color={colors.primary} />
              </div>
              
              <div className={styles.settingContent}>
                <span 
                  className={styles.settingTitle}
                  style={{ color: colors.text }}
                >
                  Color Theme
                </span>
                
                <ThemePicker
                  value={colorTheme}
                  onChange={updateColorTheme}
                  isDark={isDark}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MainSettings = () => {
  const { colors, isDark, toggleTheme } = useTheme();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Failed to sign out. Please try again.');
    }
  };

  return (
    <div 
      className={styles.container}
      style={{ backgroundColor: colors.background }}
    >
      <div className={styles.content}>
        {/* Profile Section */}
        <div className={styles.section}>
          <h3 
            className={styles.sectionTitle}
            style={{ color: colors.textSecondary }}
          >
            Account
          </h3>
          <div 
            className={styles.sectionContent}
            style={{ backgroundColor: colors.surface }}
          >
            <div 
              className={styles.settingItem}
              style={{ borderBottomColor: colors.border }}
              onClick={() => navigate('/settings/profile')}
            >
              <div className={styles.settingIcon}>
                <User size={20} color={colors.primary} />
              </div>
              
              <div className={styles.settingContent}>
                <span 
                  className={styles.settingTitle}
                  style={{ color: colors.text }}
                >
                  Profile
                </span>
                
                <ChevronRight size={16} color={colors.textSecondary} />
              </div>
            </div>
            
            <div 
              className={styles.settingItem}
              style={{ borderBottomColor: colors.border }}
              onClick={() => navigate('/settings/sync')}
            >
              <div className={styles.settingIcon}>
                <Cloud size={20} color={colors.primary} />
              </div>
              
              <div className={styles.settingContent}>
                <span 
                  className={styles.settingTitle}
                  style={{ color: colors.text }}
                >
                  Settings Sync
                </span>
                
                <ChevronRight size={16} color={colors.textSecondary} />
              </div>
            </div>
            
            <div 
              className={styles.settingItem}
              style={{ borderBottomColor: colors.border }}
              onClick={() => navigate('/settings/offline')}
            >
              <div className={styles.settingIcon}>
                <WifiOff size={20} color={colors.primary} />
              </div>
              
              <div className={styles.settingContent}>
                <span 
                  className={styles.settingTitle}
                  style={{ color: colors.text }}
                >
                  Offline Mode
                </span>
                
                <ChevronRight size={16} color={colors.textSecondary} />
              </div>
            </div>
            
            <div 
              className={styles.settingItem}
              onClick={handleSignOut}
            >
              <div className={styles.settingIcon}>
                <LogOut size={20} color={colors.error} />
              </div>
              
              <div className={styles.settingContent}>
                <span 
                  className={styles.settingTitle}
                  style={{ color: colors.error }}
                >
                  Sign Out
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Editor Section */}
        <div className={styles.section}>
          <h3 
            className={styles.sectionTitle}
            style={{ color: colors.textSecondary }}
          >
            Editor
          </h3>
          <div 
            className={styles.sectionContent}
            style={{ backgroundColor: colors.surface }}
          >
            <div 
              className={styles.settingItem}
              onClick={() => navigate('/settings/editor')}
              style={{ borderBottomColor: colors.border }}
            >
              <div className={styles.settingIcon}>
                <Code size={20} color={colors.primary} />
              </div>
              
              <div className={styles.settingContent}>
                <span 
                  className={styles.settingTitle}
                  style={{ color: colors.text }}
                >
                  Editor Settings
                </span>
                
                <ChevronRight size={16} color={colors.textSecondary} />
              </div>
            </div>
            
            <div 
              className={styles.settingItem}
              onClick={() => navigate('/settings/keyboard')}
            >
              <div className={styles.settingIcon}>
                <Keyboard size={20} color={colors.primary} />
              </div>
              
              <div className={styles.settingContent}>
                <span 
                  className={styles.settingTitle}
                  style={{ color: colors.text }}
                >
                  Keyboard Shortcuts
                </span>
                
                <ChevronRight size={16} color={colors.textSecondary} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Appearance Section */}
        <div className={styles.section}>
          <h3 
            className={styles.sectionTitle}
            style={{ color: colors.textSecondary }}
          >
            Appearance
          </h3>
          <div 
            className={styles.sectionContent}
            style={{ backgroundColor: colors.surface }}
          >
            <div 
              className={styles.settingItem}
              onClick={() => navigate('/settings/appearance')}
            >
              <div className={styles.settingIcon}>
                {isDark ? 
                  <Moon size={20} color={colors.primary} /> : 
                  <Sun size={20} color={colors.primary} />
                }
              </div>
              
              <div className={styles.settingContent}>
                <span 
                  className={styles.settingTitle}
                  style={{ color: colors.text }}
                >
                  Theme & Appearance
                </span>
                
                <ChevronRight size={16} color={colors.textSecondary} />
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className={styles.section}>
          <h3 
            className={styles.sectionTitle}
            style={{ color: colors.textSecondary }}
          >
            About
          </h3>
          <div 
            className={styles.sectionContent}
            style={{ backgroundColor: colors.surface }}
          >
            <div 
              className={styles.settingItem}
              onClick={() => navigate('/settings/about')}
            >
              <div className={styles.settingIcon}>
                <Info size={20} color={colors.primary} />
              </div>
              
              <div className={styles.settingContent}>
                <span 
                  className={styles.settingTitle}
                  style={{ color: colors.text }}
                >
                  About Code Canvas
                </span>
                
                <span 
                  style={{ color: colors.textSecondary, fontSize: '14px' }}
                >
                  v1.2.0
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className={styles.footer}>
          <span 
            className={styles.footerText}
            style={{ color: colors.textSecondary }}
          >
            Code Canvas © 2025
          </span>
        </div>
      </div>
    </div>
  );
};

const SettingsScreen = () => {
  return (
    <Routes>
      <Route path="/" element={<MainSettings />} />
      <Route path="/profile" element={<ProfileSettings />} />
      <Route path="/offline" element={<OfflineSettingsScreen />} />
      <Route path="/editor" element={<EditorSettingsScreen />} />
      <Route path="/keyboard" element={<KeyboardSettingsScreen />} />
      <Route path="/sync" element={<SyncSettingsScreen />} />
      <Route path="/appearance" element={<AppearanceScreen />} />
      <Route path="/about" element={<AboutScreen />} />
    </Routes>
  );
};

export default SettingsScreen;