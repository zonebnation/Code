import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Code, FolderTree, Settings, Command as CommandIcon, Search as SearchIcon, Video as VideoIcon, GitBranch, Users, Keyboard, Share2, Plus } from 'lucide-react';
import CommandPalette from '../../components/CommandPalette/CommandPalette';
import CommandService from '../../services/CommandService';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import GlobalSearch from '../../components/Search/GlobalSearch';
import OfflineIndicator from '../../components/Offline/OfflineIndicator';
import KeyboardShortcutsHelp from '../../components/Help/KeyboardShortcutsHelp';
import SyncStatusIndicator from '../../components/Navbar/SyncStatusIndicator';
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
    syncOfflineChanges,
    createNewProject
  } = useProject();
  const { user } = useAuth();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const navigate = useNavigate();
  
  // Track window size for responsive design
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Register key bindings with the KeyBindingsService
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
    
    const quickCreateUnregister = keyBindingsService.registerHandler(
      'global.quickCreate',
      handleQuickCreate
    );
    
    // Set current scope to global
    keyBindingsService.setScope('global');
    
    // Cleanup function
    return () => {
      commandPaletteUnregister();
      globalSearchUnregister();
      toggleThemeUnregister();
      showKeyboardHelpUnregister();
      quickCreateUnregister();
    };
  }, [toggleTheme]);
  
  // Register default commands
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
            handleQuickCreate();
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
      },
      
      // Quick create file
      {
        id: 'file.quickCreate',
        title: 'File: Quick Create and Open File',
        category: 'File',
        action: handleQuickCreate
      }
    ]);
  }, [currentProject, isDark, currentFile, openFiles, isOffline]);
  
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

  // Quick create function - creates a new file and opens it in editor
  function handleQuickCreate() {
    try {
      // Create a new file named "index.js" if no project exists, otherwise create "newfile.js"
      const fileName = currentProject ? "newfile.js" : "index.js";
      
      // If no project exists, create one first
      if (!currentProject) {
        createNewProject("My Project");
      }
      
      // Create the file
      createNewFile(fileName);
      
      // Navigate to editor
      navigate('/editor');
    } catch (error) {
      console.error('Error creating file:', error);
      alert('Failed to create file. Please try again.');
    }
  }

  // Determine if we're on a mobile device
  const isMobile = windowWidth <= 767;
  const isVerySmallScreen = windowWidth <= 374;
  
  // Get icon size based on screen size
  const getIconSize = () => {
    if (isVerySmallScreen) return 20;
    if (isMobile) return 22;
    return 24;
  };
  
  // Should we show labels on the navbar?
  const showLabels = windowWidth > 320;
  
  // Adjust active tab style based on screen size
  const getTabClassName = ({ isActive }: { isActive: boolean }) => {
    return `${styles.tabItem} ${isActive ? styles.active : ''}`;
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
          <CommandIcon size={isMobile ? 18 : 20} color={colors.textSecondary} />
        </button>
      </div>
      
      <div className={styles.searchButtonContainer}>
        <button
          className={styles.searchButton}
          onClick={() => setSearchOpen(true)}
          title="Search in Files (Ctrl+Shift+F)"
          aria-label="Search in files"
        >
          <SearchIcon size={isMobile ? 18 : 20} color={colors.textSecondary} />
        </button>
      </div>
      
      {/* Show sync status indicator */}
      <div style={{ 
        position: 'fixed', 
        top: 'max(12px, env(safe-area-inset-top, 12px))', 
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
      
      {/* Quick create button */}
      <div style={{ 
        position: 'fixed', 
        bottom: 'max(80px, calc(80px + env(safe-area-inset-bottom, 0px)))', 
        right: 'max(16px, env(safe-area-inset-right, 16px))', 
        zIndex: 900
      }}>
        <button
          onClick={handleQuickCreate}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: colors.primary,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
            border: 'none',
            cursor: 'pointer',
            touchAction: 'manipulation'
          }}
          aria-label="Create new file"
          title="Create new file"
        >
          <Plus size={24} color="white" />
        </button>
      </div>
      
      <nav 
        className={styles.tabBar}
        style={{ 
          backgroundColor: colors.surface,
          borderTopColor: colors.border
        }}
        role="navigation"
      >
        <NavLink 
          to="/editor" 
          className={getTabClassName}
          style={({ isActive }) => ({
            color: isActive ? colors.primary : colors.textSecondary,
          })}
        >
          <Code size={getIconSize()} />
          {showLabels && <span className={styles.tabLabel}>Editor</span>}
        </NavLink>
        
        <NavLink 
          to="/explorer" 
          className={getTabClassName}
          style={({ isActive }) => ({
            color: isActive ? colors.primary : colors.textSecondary,
          })}
        >
          <FolderTree size={getIconSize()} />
          {showLabels && <span className={styles.tabLabel}>Explorer</span>}
        </NavLink>
        
        <NavLink 
          to="/videos" 
          className={getTabClassName}
          style={({ isActive }) => ({
            color: isActive ? colors.primary : colors.textSecondary,
          })}
        >
          <VideoIcon size={getIconSize()} />
          {showLabels && <span className={styles.tabLabel}>Videos</span>}
        </NavLink>
        
        <NavLink 
          to="/collaboration" 
          className={getTabClassName}
          style={({ isActive }) => ({
            color: isActive ? colors.primary : colors.textSecondary,
          })}
        >
          <Users size={getIconSize()} />
          {showLabels && <span className={styles.tabLabel}>Collab</span>}
        </NavLink>
        
        <NavLink 
          to="/settings" 
          className={getTabClassName}
          style={({ isActive }) => ({
            color: isActive ? colors.primary : colors.textSecondary,
          })}
        >
          <Settings size={getIconSize()} />
          {showLabels && <span className={styles.tabLabel}>Settings</span>}
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