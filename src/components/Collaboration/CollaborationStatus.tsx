import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { 
  User, 
  UserPlus, 
  Users, 
  Clock, 
  Edit,
  Eye
} from 'lucide-react';
import styles from './CollaborationStatus.module.css';

type ActiveUser = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  current_file?: string | null;
  last_active: Date;
};

const CollaborationStatus: React.FC = () => {
  const { colors } = useTheme();
  const { currentProject, currentFile, fileTree } = useProject();
  const { user } = useAuth();
  
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Update presence and fetch active users
  useEffect(() => {
    if (!currentProject || !user) return;
    
    const presenceChannel = supabase.channel(`presence-${currentProject.id}`);
    let presenceTimeout: ReturnType<typeof setTimeout>;
    
    const trackPresence = () => {
      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState();
          const newActiveUsers: ActiveUser[] = [];
          
          // Format presence data
          Object.keys(state).forEach(clientId => {
            const userPresences = state[clientId];
            userPresences.forEach((presence: any) => {
              if (presence.user_id && presence.username) {
                // Check if user is already in the list
                const existingUser = newActiveUsers.find(u => u.id === presence.user_id);
                if (!existingUser) {
                  newActiveUsers.push({
                    id: presence.user_id,
                    username: presence.username,
                    avatar_url: presence.avatar_url,
                    current_file: presence.current_file,
                    last_active: new Date()
                  });
                }
              }
            });
          });
          
          setActiveUsers(newActiveUsers);
          setLoading(false);
        });
    };
    
    const setupPresence = async () => {
      await presenceChannel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const updatePresence = () => {
            presenceChannel.track({
              user_id: user.id,
              username: user.user_metadata?.username || user.email?.split('@')[0],
              avatar_url: user.user_metadata?.avatar_url || null,
              current_file: currentFile?.id || null,
              online_at: new Date().toISOString()
            });
            
            // Set timeout to update presence regularly
            presenceTimeout = setTimeout(updatePresence, 30000); // 30 seconds
          };
          
          updatePresence();
          trackPresence();
        }
      });
    };
    
    setupPresence();
    
    return () => {
      clearTimeout(presenceTimeout);
      presenceChannel.untrack();
      presenceChannel.unsubscribe();
    };
  }, [currentProject, user]);
  
  // Update presence when the current file changes
  useEffect(() => {
    if (!currentProject || !user || !currentFile) return;
    
    const presenceChannel = supabase.channel(`presence-${currentProject.id}`);
    
    presenceChannel.track({
      user_id: user.id,
      username: user.user_metadata?.username || user.email?.split('@')[0],
      avatar_url: user.user_metadata?.avatar_url || null,
      current_file: currentFile?.id || null,
      online_at: new Date().toISOString()
    });
    
    return () => {
      presenceChannel.untrack();
    };
  }, [currentFile]);
  
  // Format file name for display
  const getFileName = (fileId: string | null | undefined): string => {
    if (!fileId || !currentProject) return 'Not editing';
    
    const file = fileTree.find(f => f.id === fileId);
    return file ? file.name : 'Unknown file';
  };
  
  // Format timestamp for display
  const formatLastActive = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 60) {
      return 'just now';
    } else if (diffSec < 3600) {
      const minutes = Math.floor(diffSec / 60);
      return `${minutes}m ago`;
    } else if (diffSec < 86400) {
      const hours = Math.floor(diffSec / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffSec / 86400);
      return `${days}d ago`;
    }
  };
  
  // Get permission icon
  const getPermissionIcon = (userId: string) => {
    // For now, we'll just show edit icon for everyone except the current user
    // In a real implementation, you'd check the actual permission level
    if (userId === user?.id) {
      return <Edit size={12} color={colors.primary} />;
    }
    return <Edit size={12} color={colors.primary} />;
  };
  
  if (loading || activeUsers.length <= 1) {
    return null; // Don't show if only the current user is active
  }

  return (
    <div 
      className={styles.container}
      style={{ 
        backgroundColor: colors.surface,
        borderBottomColor: colors.border
      }}
    >
      <div className={styles.title}>
        <Users size={14} color={colors.primary} />
        <span style={{ color: colors.text }}>
          {activeUsers.length} {activeUsers.length === 1 ? 'person' : 'people'} online
        </span>
      </div>
      
      <div className={styles.userList}>
        {activeUsers.map(activeUser => (
          <div 
            key={activeUser.id}
            className={styles.userItem}
            style={{ 
              color: activeUser.id === user?.id ? colors.primary : colors.text
            }}
          >
            <div className={styles.userAvatar}>
              {activeUser.avatar_url ? (
                <img src={activeUser.avatar_url} alt={activeUser.username || 'User'} />
              ) : (
                <User size={14} color={activeUser.id === user?.id ? colors.primary : colors.textSecondary} />
              )}
              <div 
                className={styles.statusDot}
                style={{ backgroundColor: colors.success }}
              />
            </div>
            
            <div className={styles.userInfo}>
              <span className={styles.username}>
                {activeUser.username || 'Anonymous'}
                {activeUser.id === user?.id ? ' (You)' : ''}
              </span>
              
              {activeUser.current_file && (
                <span 
                  className={styles.activeFile}
                  style={{ color: colors.textSecondary }}
                >
                  Editing: {getFileName(activeUser.current_file)}
                </span>
              )}
            </div>
            
            <div 
              className={styles.lastActive}
              title={activeUser.last_active.toLocaleString()}
            >
              <Clock size={12} color={colors.textSecondary} />
              <span style={{ color: colors.textSecondary }}>
                {formatLastActive(activeUser.last_active)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CollaborationStatus;