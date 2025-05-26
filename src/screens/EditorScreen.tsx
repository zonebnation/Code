import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import CodeEditor from '../components/Editor/CodeEditor';
import MonacoEditor from '../components/Editor/MonacoEditor';
import EditorToolbar from '../components/Editor/EditorToolbar';
import EditorTabs from '../components/Editor/EditorTabs';
import EmptyState from '../components/shared/EmptyState';
import VersionControlPanel from '../components/VersionControl/VersionControlPanel';
import CollaborationStatus from '../components/Collaboration/CollaborationStatus';
import ChatPanel from '../components/Collaboration/ChatPanel';
import CollaborationService from '../services/CollaborationService';
import { PresenceData, CursorData } from '../types/collaboration';
import styles from './EditorScreen.module.css';

const EditorScreen = () => {
  const { colors } = useTheme();
  const { currentProject, openFiles, currentFile, saveFile, updateFileContent } = useProject();
  const { user, profile } = useAuth();
  
  const [code, setCode] = useState<string>('');
  const [useMonacoEditor, setUseMonacoEditor] = useState<boolean>(true);
  const [showDebugger, setShowDebugger] = useState<boolean>(false);
  const [showVersionControl, setShowVersionControl] = useState<boolean>(true);
  const [showChat, setShowChat] = useState<boolean>(true);
  const [isCollaborative, setIsCollaborative] = useState<boolean>(false);
  const [collaborators, setCollaborators] = useState<PresenceData[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<CursorData[]>([]);

  useEffect(() => {
    if (currentFile) {
      setCode(currentFile.content);
    } else {
      setCode('');
    }
  }, [currentFile]);

  // Check browser/device capabilities to decide which editor to use
  useEffect(() => {
    // On very low-end devices, we might want to use the simpler editor
    const isLowEndDevice = navigator.deviceMemory && navigator.deviceMemory < 4;
    const savedPreference = localStorage.getItem('codeCanvas_useMonacoEditor');
    
    if (savedPreference !== null) {
      setUseMonacoEditor(savedPreference === 'true');
    } else {
      setUseMonacoEditor(!isLowEndDevice);
    }
  }, []);
  
  // Check if the current project is collaborative and set up presence
  useEffect(() => {
    if (currentProject && user) {
      // Check if project is collaborative
      const checkCollaboration = async () => {
        const isCollab = await CollaborationService.isCollaborativeProject(currentProject.id);
        setIsCollaborative(isCollab);
        
        if (isCollab) {
          // Join collaboration session
          await CollaborationService.joinProject(
            currentProject.id,
            user.id,
            profile?.username || user.email?.split('@')[0] || 'Anonymous',
            profile?.avatar_url,
            setCollaborators
          );
          
          // Update current file status if needed
          if (currentFile) {
            await CollaborationService.updateEditingFile(
              currentProject.id,
              user.id,
              currentFile.id
            );
          }
        }
      };
      
      checkCollaboration();
      
      // Clean up when component unmounts or project changes
      return () => {
        if (isCollaborative) {
          CollaborationService.leaveProject(currentProject.id);
        }
      };
    }
  }, [currentProject, user]);
  
  // Update collaboration state when current file changes
  useEffect(() => {
    if (isCollaborative && currentProject && user && currentFile) {
      CollaborationService.updateEditingFile(
        currentProject.id,
        user.id,
        currentFile.id
      );
    }
  }, [currentFile, isCollaborative, currentProject, user]);

  const handleCodeChange = (text: string) => {
    setCode(text);
    if (currentFile) {
      // Update content in context to track unsaved changes
      updateFileContent(currentFile.id, text);
      
      // If collaborative, broadcast the change
      if (isCollaborative && currentProject && user && profile) {
        CollaborationService.broadcastFileChange(
          currentProject.id,
          currentFile.id,
          text,
          {
            userId: user.id,
            username: profile.username || user.email?.split('@')[0] || 'Anonymous',
            avatarUrl: profile.avatar_url
          }
        );
      }
    }
  };
  
  // Handle content changes from other users
  const handleRemoteContentChange = (fileId: string, content: string, remoteUser: PresenceData) => {
    // Only update if it's the current file
    if (currentFile && currentFile.id === fileId) {
      setCode(content);
      updateFileContent(fileId, content);
    }
  };
  
  // Handle cursor changes from other users
  const handleRemoteCursorsChange = (cursors: CursorData[]) => {
    setRemoteCursors(cursors);
  };

  const handleSave = () => {
    if (currentFile) {
      saveFile(currentFile.id, code);
    }
  };

  // Toggle between editors
  const toggleEditor = () => {
    setUseMonacoEditor(!useMonacoEditor);
    localStorage.setItem('codeCanvas_useMonacoEditor', (!useMonacoEditor).toString());
  };

  // Toggle debugger
  const toggleDebugger = () => {
    setShowDebugger(!showDebugger);
  };

  // Toggle version control panel
  const toggleVersionControl = () => {
    setShowVersionControl(!showVersionControl);
  };
  
  // Toggle chat panel
  const toggleChat = () => {
    setShowChat(!showChat);
  };

  if (!currentProject) {
    return (
      <EmptyState
        icon="FileCode"
        title="No Project Open"
        message="Open a project from your device or create a new one to start coding."
        actionText="Browse Projects"
        onAction={() => {}} // This will now use the handleBrowseFiles function from EmptyState
      />
    );
  }

  if (openFiles.length === 0) {
    return (
      <EmptyState
        icon="File"
        title="No Files Open"
        message="Open a file from the Explorer to start editing, or create a new file."
        actionText="Browse Files"
        actionPath="/explorer"
      />
    );
  }

  return (
    <div 
      className={styles.container} 
      style={{ backgroundColor: colors.background }}
    >
      {/* Show collaboration status if project is collaborative */}
      {isCollaborative && collaborators.length > 0 && (
        <CollaborationStatus />
      )}
      
      <EditorTabs />
      
      <EditorToolbar 
        onSave={handleSave} 
        onToggleEditor={toggleEditor} 
        onToggleDebugger={toggleDebugger} 
        isDebuggerActive={showDebugger}
        onToggleChat={toggleChat}
        isChatActive={showChat && isCollaborative}
        isCollaborative={isCollaborative}
      />
      
      <div className={styles.editorContainer}>
        {currentFile && (
          <>
            {useMonacoEditor ? (
              <MonacoEditor
                code={code}
                language={currentFile.language}
                onChange={handleCodeChange}
                isCollaborative={isCollaborative}
              />
            ) : (
              <CodeEditor
                code={code}
                language={currentFile.language}
                onChange={handleCodeChange}
              />
            )}
          </>
        )}
      </div>
      
      {showVersionControl && <VersionControlPanel />}
      
      {/* Show chat panel if project is collaborative */}
      {isCollaborative && showChat && <ChatPanel />}
    </div>
  );
};

export default EditorScreen;