import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Code, FolderTree, Settings, Command as CommandIcon, Search as SearchIcon, Video as VideoIcon, GitBranch, Users, Keyboard, Share2 } from 'lucide-react';
import CommandPalette from '../CommandPalette/CommandPalette';
import CommandService from '../../services/CommandService';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import GlobalSearch from '../Search/GlobalSearch';
import OfflineIndicator from '../Offline/OfflineIndicator';
import KeyboardShortcutsHelp from '../Help/KeyboardShortcutsHelp';
import SyncStatusIndicator from '../Navbar/SyncStatusIndicator';
import keyBindingsService from '../../services/KeyBindingsService';
import styles from './Layout.module.css';

const Layout = () => {
  const { colors, isDark, toggleTheme } = useTheme();
  const { 
    createNewFile, 
    createNewFolder, 
    currentProject, 
    selectProject, 
    currentFile, 
    saveFile,
    openFiles,
    setCurrentFile,
    isOffline,
    toggleOfflineMode,
    syncOfflineChanges
  } = useProject();
  const { user } = useAuth();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const navigate = useNavigate();
  
  // Track window size for responsive design
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {
    // Register default commands
    CommandService.registerCommands([
      // File commands
      {
        id: 'file.new',
        title: 'File: New File',
        category: 'File',
        action: () => {
          if (currentProject) {
            createNewFile('untitled.js');
          } else {
            alert('Please open a project first');
          }
        }
      },
      {
        id: 'file.newFolder',
        title: 'File: New Folder',
        category: 'File',
        action: () => {
          if (currentProject) {
            createNewFolder('New Folder');
          } else {
            alert('Please open a project first');
          }
        }
      },
      {
        id: 'file.save',
        title: 'File: Save',
        category: 'File',
        shortcut: 'Ctrl+S',
        action: () => {
          if (currentFile) {
            saveFile(currentFile.id, currentFile.content);
            alert('File saved');
          } else {
            alert('No file is currently open');
          }
        }
      },
      {
        id: 'file.closeProject',
        title: 'File: Close Project',
        category: 'File',
        action: () => {
          if (currentProject) {
            selectProject('');
          }
        }
      },
      
      // View commands
      {
        id: 'view.explorer',
        title: 'View: Show Explorer',
        category: 'View',
        action: () => navigate('/explorer')
      },
      {
        id: 'view.editor',
        title: 'View: Show Editor',
        category: 'View',
        action: () => navigate('/editor')
      },
      {
        id: 'view.videos',
        title: 'View: Show Videos',
        category: 'View',
        action: () => navigate('/videos')
      },
      {
        id: 'view.terminal',
        title: 'View: Show Terminal',
        category: 'View',
        action: () => navigate('/terminal')
      },
      {
        id: 'view.settings',
        title: 'View: Show Settings',
        category: 'View',
        action: () => navigate('/settings')
      },
      {
        id: 'view.toggleTheme',
        title: isDark ? 'View: Switch to Light Theme' : 'View: Switch to Dark Theme',
        category: 'View',
        action: toggleTheme
      },
      
      // Search commands
      {
        id: 'search.global',
        title: 'Search: Search Across Files',
        category: 'Search',
        shortcut: 'Ctrl+Shift+F',
        action: () => setSearchOpen(true)
      },
      
      // Sharing commands
      {
        id: 'share.view',
        title: 'Share: View My Shared Items',
        category: 'Share',
        action: () => navigate('/shared')
      },
      
      {
        id: 'share.file',
        title: 'Share: Share Current File',
        category: 'Share',
        action: () => {
          if (currentFile) {
            // Open share dialog for current file
            CommandService.executeCommand('file.share');
          } else {
            alert('No file is open to share');
          }
        }
      },
      
      {
        id: 'share.project',
        title: 'Share: Share Current Project',
        category: 'Share',
        action: () => {
          if (currentProject) {
            // Open share dialog for current project
            CommandService.executeCommand('project.share');
          } else {
            alert('No project is open to share');
          }
        }
      },
      
      // Git commands
      {
        id: 'git.commit',
        title: 'Git: Commit Changes',
        category: 'Git',
        action: () => navigate('/editor')
      },
      {
        id: 'git.push',
        title: 'Git: Push to Remote',
        category: 'Git',
        action: () => navigate('/editor')
      },
      {
        id: 'git.pull',
        title: 'Git: Pull from Remote',
        category: 'Git',
        action: () => navigate('/editor')
      },
      {
        id: 'git.createBranch',
        title: 'Git: Create New Branch',
        category: 'Git',
        action: () => navigate('/editor')
      },
      {
        id: 'git.switchBranch',
        title: 'Git: Switch Branch',
        category: 'Git',
        action: () => navigate('/editor')
      },
      
      // Collaboration commands
      {
        id: 'collaboration.shareProject',
        title: 'Collaboration: Share Current Project',
        category: 'Collaboration',
        action: () => navigate('/collaboration')
      },
      {
        id: 'collaboration.viewInvitations',
        title: 'Collaboration: View Invitations',
        category: 'Collaboration',
        action: () => navigate('/collaboration')
      },
      {
        id: 'collaboration.manageCollaborators',
        title: 'Collaboration: Manage Collaborators',
        category: 'Collaboration',
        action: () => navigate('/collaboration')
      },
      
      // Offline/Sync commands
      {
        id: 'sync.toggleOfflineMode',
        title: isOffline ? 'Go Online' : 'Go Offline',
        category: 'Sync',
        action: toggleOfflineMode
      },
      {
        id: 'sync.syncNow',
        title: 'Sync: Sync Changes Now',
        category: 'Sync',
        action: syncOfflineChanges
      },
      
      // Keyboard shortcuts help
      {
        id: 'help.keyboardShortcuts',
        title: 'Help: Keyboard Shortcuts',
        category: 'Help',
        action: () => setShowKeyboardHelp(true)
      }
    ]);
  }, [currentProject, isDark, currentFile, openFiles, isOffline]);
  
  // Register keyboard shortcuts with the KeyBindingsService
  useEffect(() => {
    // Global shortcuts
    const commandPaletteUnregister = keyBindingsService.registerHandler(
      'global.commandPalette', 
      () => setCommandPaletteOpen(true)
    );
    
    const globalSearchUnregister = keyBindingsService.registerHandler(
      'global.search', 
      () => setSearchOpen(true)
    );
    
    const toggleThemeUnregister = keyBindingsService.registerHandler(
      'global.toggleTheme', 
      toggleTheme
    );
    
    const showKeyboardHelpUnregister = keyBindingsService.registerHandler(
      'global.shortcuts', 
      () => setShowKeyboardHelp(true)
    );
    
    // Set current scope to global
    keyBindingsService.setScope('global');
    
    // Cleanup function
    return () => {
      commandPaletteUnregister();
      globalSearchUnregister();
      toggleThemeUnregister();
      showKeyboardHelpUnregister();
    };
  }, [toggleTheme]);
  
  const handleFileSelect = (fileId: string, lineNumber: number) => {
    // Check if file is already open
    const fileTab = openFiles.find(f => f.id === fileId);
    
    if (fileTab) {
      setCurrentFile(fileId);
      // TODO: When selecting a search result, we should scroll to the line
      // This would require extending the editor component
    }
    
    navigate('/editor');
  };
  
  const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
    color: isActive ? colors.primary : colors.textSecondary,
  });

  // Get label for nav item based on screen size
  const getNavLabel = (text: string) => {
    if (windowWidth < 360) { // Very small screens, show no text
      return null;
    }
    return <span className={styles.tabLabel}>{text}</span>;
  };

  return (
    <div 
      className={styles.container}
      style={{ backgroundColor: colors.background }}
    >
      <div className={styles.commandButtonContainer}>
        <button
          className={styles.commandButton}
          onClick={() => setCommandPaletteOpen(true)}
          title="Command Palette (Ctrl+Shift+P)"
          aria-label="Open command palette"
        >
          <CommandIcon size={windowWidth < 768 ? 18 : 20} color={colors.textSecondary} />
        </button>
      </div>
      
      <div className={styles.searchButtonContainer}>
        <button
          className={styles.searchButton}
          onClick={() => setSearchOpen(true)}
          title="Search in Files (Ctrl+Shift+F)"
          aria-label="Search in files"
        >
          <SearchIcon size={windowWidth < 768 ? 18 : 20} color={colors.textSecondary} />
        </button>
      </div>
      
      {/* Show sync status indicator */}
      <div style={{ 
        position: 'fixed', 
        top: '12px', 
        right: '100px', 
        zIndex: 900
      }}>
        <SyncStatusIndicator />
      </div>
      
      <OfflineIndicator />
      
      <main className={styles.content}>
        {searchOpen ? (
          <GlobalSearch 
            onClose={() => setSearchOpen(false)} 
            onFileSelect={handleFileSelect}
          />
        ) : (
          <Outlet />
        )}
      </main>
      
      <nav 
        className={styles.tabBar}
        style={{ 
          backgroundColor: colors.surface,
          borderTopColor: colors.border
        }}
      >
        <NavLink 
          to="/editor" 
          className={styles.tabItem}
          style={navLinkStyle}
        >
          <Code size={windowWidth < 360 ? 20 : 24} />
          {getNavLabel('Editor')}
        </NavLink>
        
        <NavLink 
          to="/explorer" 
          className={styles.tabItem}
          style={navLinkStyle}
        >
          <FolderTree size={windowWidth < 360 ? 20 : 24} />
          {getNavLabel('Explorer')}
        </NavLink>
        
        <NavLink 
          to="/videos" 
          className={styles.tabItem}
          style={navLinkStyle}
        >
          <VideoIcon size={windowWidth < 360 ? 20 : 24} />
          {getNavLabel('Videos')}
        </NavLink>
        
        <NavLink 
          to="/collaboration" 
          className={styles.tabItem}
          style={navLinkStyle}
        >
          <Users size={windowWidth < 360 ? 20 : 24} />
          {getNavLabel('Collab')}
        </NavLink>
        
        <NavLink 
          to="/settings" 
          className={styles.tabItem}
          style={navLinkStyle}
        >
          <Settings size={windowWidth < 360 ? 20 : 24} />
          {getNavLabel('Settings')}
        </NavLink>
      </nav>
      
      <CommandPalette 
        isOpen={commandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)}
      />
      
      {showKeyboardHelp && (
        <KeyboardShortcutsHelp onClose={() => setShowKeyboardHelp(false)} />
      )}
    </div>
  );
};

export default Layout;