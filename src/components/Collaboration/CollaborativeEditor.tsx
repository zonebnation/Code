import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import CollaborationService from '../../services/CollaborationService';
import { CursorData, PresenceData } from '../../types/collaboration';
import styles from './CollaborativeEditor.module.css';

interface CollaborativeEditorProps {
  children: React.ReactNode;
  fileId: string;
  content: string;
  onContentChange: (content: string) => void;
}

const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  children,
  fileId,
  content,
  onContentChange
}) => {
  const { colors } = useTheme();
  const { currentProject } = useProject();
  const { user, profile } = useAuth();
  
  const [cursors, setCursors] = useState<CursorData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const editorRef = useRef<any>(null);
  
  // Set up collaborative editing
  useEffect(() => {
    if (!currentProject || !user || !fileId) return;
    
    const setupCollaboration = async () => {
      try {
        // Check if project is collaborative
        const isCollab = await CollaborationService.isCollaborativeProject(currentProject.id);
        
        if (!isCollab) {
          console.log('Project is not collaborative');
          return;
        }
        
        // Join collaborative editing for this file
        await CollaborationService.joinFile(
          currentProject.id,
          fileId,
          user.id,
          profile?.username || user.email?.split('@')[0] || 'Anonymous',
          profile?.avatar_url || null,
          editorRef.current,
          handleRemoteContentChange,
          handleRemoteCursorsChange
        );
        
        setIsConnected(true);
      } catch (error) {
        console.error('Error setting up collaboration:', error);
        setError('Failed to connect to collaborative session');
      }
    };
    
    setupCollaboration();
    
    // Clean up when unmounting
    return () => {
      if (currentProject && fileId) {
        CollaborationService.leaveFile(currentProject.id, fileId);
      }
    };
  }, [currentProject, user, fileId, profile]);

  // Handle remote content changes
  const handleRemoteContentChange = (fileId: string, newContent: string, remoteUser: PresenceData) => {
    console.log(`Received content change from ${remoteUser.username}`);
    onContentChange(newContent);
  };
  
  // Handle remote cursor changes
  const handleRemoteCursorsChange = (newCursors: CursorData[]) => {
    setCursors(newCursors);
  };

  // Capture reference to the editor
  const setEditorRef = (editor: any) => {
    editorRef.current = editor;
    
    // If we already have a connection, we need to rejoin with the new editor
    if (isConnected && currentProject && user && fileId) {
      CollaborationService.leaveFile(currentProject.id, fileId);
      
      CollaborationService.joinFile(
        currentProject.id,
        fileId,
        user.id,
        profile?.username || user.email?.split('@')[0] || 'Anonymous',
        profile?.avatar_url || null,
        editor,
        handleRemoteContentChange,
        handleRemoteCursorsChange
      );
    }
  };
  
  return (
    <div className={styles.container}>
      {error && (
        <div 
          className={styles.errorBanner}
          style={{ 
            backgroundColor: `${colors.error}20`,
            color: colors.error
          }}
        >
          {error}
        </div>
      )}
      
      {/* Render children with ref */}
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          // Use a more specific type assertion
          return React.cloneElement(child as React.ReactElement<any>, 
            { ref: setEditorRef } as React.HTMLAttributes<unknown>);
        }
        return child;
      })}
      
      {/* Render remote cursors */}
      <div className={styles.cursorsContainer}>
        {cursors.map(cursor => (
          <div 
            key={cursor.userId}
            className={styles.cursorLabel}
            style={{
              backgroundColor: cursor.color || colors.primary,
              color: '#FFFFFF'
            }}
          >
            {cursor.username}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CollaborativeEditor;