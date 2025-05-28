import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { 
  User, 
  Send, 
  Image, 
  X, 
  MessageSquare, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import styles from './ChatPanel.module.css';
import { RealtimeChannel } from '@supabase/supabase-js';

type ChatMessage = {
  id: string;
  content: string;
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
};

const ChatPanel: React.FC = () => {
  const { colors } = useTheme();
  const { currentProject } = useProject();
  const { user, profile } = useAuth();
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatChannel, setChatChannel] = useState<RealtimeChannel | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Load initial messages and set up subscription
  useEffect(() => {
    if (currentProject && user) {
      fetchMessages();
      setupRealtimeSubscription();
      
      return () => {
        if (chatChannel) {
          supabase.removeChannel(chatChannel);
        }
      };
    }
  }, [currentProject, user]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Update unread count when collapsed
  useEffect(() => {
    if (!isCollapsed) {
      setUnreadCount(0);
    }
  }, [isCollapsed]);
  
  // Fetch chat messages
  const fetchMessages = async () => {
    if (!currentProject) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('project_messages')
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles:user_id (id, username, avatar_url)
        `)
        .eq('project_id', currentProject.id)
        .order('created_at', { ascending: true })
        .limit(100);
      
      if (error) throw error;
      
      const formattedMessages: ChatMessage[] = data.map(msg => {
        const profiles = msg.profiles as any;
        return {
          id: msg.id,
          content: msg.content,
          user_id: msg.user_id,
          username: profiles.username,
          avatar_url: profiles.avatar_url,
          created_at: msg.created_at
        };
      });
      
      setMessages(formattedMessages);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      setError('Failed to load chat messages');
    } finally {
      setLoading(false);
    }
  };
  
  // Set up realtime subscription for new messages
  const setupRealtimeSubscription = () => {
    if (!currentProject) return;
    
    const channel = supabase
      .channel('chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_messages',
          filter: `project_id=eq.${currentProject.id}`
        },
        async (payload) => {
          // When a new message comes in, fetch user info
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', payload.new.user_id)
            .single();
            
          if (userError) {
            console.error('Error fetching user data:', userError);
            return;
          }
          
          const newMessage: ChatMessage = {
            id: payload.new.id,
            content: payload.new.content,
            user_id: payload.new.user_id,
            username: userData.username,
            avatar_url: userData.avatar_url,
            created_at: payload.new.created_at
          };
          
          setMessages(prevMessages => [...prevMessages, newMessage]);
          
          // If the chat is collapsed, increment unread count
          if (isCollapsed) {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();
      
    setChatChannel(channel);
  };
  
  // Send a new message
  const handleSendMessage = async () => {
    if (!currentProject || !user || !newMessage.trim()) return;
    
    try {
      const { error } = await supabase
        .from('project_messages')
        .insert({
          project_id: currentProject.id,
          user_id: user.id,
          content: newMessage.trim()
        });
      
      if (error) throw error;
      
      // Clear input
      setNewMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  };
  
  // Handle keyboard submit
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div 
      className={`${styles.container} ${isCollapsed ? styles.collapsed : ''}`}
      style={{ 
        backgroundColor: colors.surface,
        borderTopColor: colors.border
      }}
    >
      {/* Chat Header */}
      <div 
        className={styles.header}
        style={{ borderBottomColor: isCollapsed ? 'transparent' : colors.border }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className={styles.headerTitle}>
          <MessageSquare size={16} color={colors.primary} />
          <h3 style={{ color: colors.text }}>Project Chat</h3>
          {isCollapsed && unreadCount > 0 && (
            <div 
              className={styles.unreadBadge}
              style={{ backgroundColor: colors.primary }}
            >
              {unreadCount}
            </div>
          )}
        </div>
        
        <button 
          className={styles.collapseButton}
          onClick={(e) => {
            e.stopPropagation();
            setIsCollapsed(!isCollapsed);
          }}
          aria-label={isCollapsed ? 'Expand chat' : 'Collapse chat'}
        >
          {isCollapsed ? (
            <ChevronUp size={16} color={colors.textSecondary} />
          ) : (
            <ChevronDown size={16} color={colors.textSecondary} />
          )}
        </button>
      </div>
      
      {/* Chat Content */}
      {!isCollapsed && (
        <>
          <div 
            className={styles.messageContainer}
            ref={messagesContainerRef}
          >
            {loading ? (
              <div className={styles.loading} style={{ color: colors.textSecondary }}>
                Loading messages...
              </div>
            ) : error ? (
              <div className={styles.error} style={{ color: colors.error }}>
                {error}
              </div>
            ) : messages.length === 0 ? (
              <div className={styles.emptyState} style={{ color: colors.textSecondary }}>
                No messages yet. Start the conversation!
              </div>
            ) : (
              <div className={styles.messages}>
                {messages.map((msg, index) => {
                  const isCurrentUser = msg.user_id === user?.id;
                  const showAvatar = index === 0 || messages[index - 1].user_id !== msg.user_id;
                  
                  return (
                    <div 
                      key={msg.id}
                      className={`${styles.messageWrapper} ${isCurrentUser ? styles.currentUser : ''}`}
                    >
                      {!isCurrentUser && showAvatar && (
                        <div 
                          className={styles.avatar}
                          style={{ backgroundColor: `${colors.primary}30` }}
                        >
                          {msg.avatar_url ? (
                            <img src={msg.avatar_url} alt={msg.username || 'User'} />
                          ) : (
                            <User size={14} color={colors.primary} />
                          )}
                        </div>
                      )}
                      
                      <div className={styles.messageContent}>
                        {showAvatar && (
                          <div className={styles.messageHeader}>
                            <span 
                              className={styles.username}
                              style={{ 
                                color: isCurrentUser ? colors.primary : colors.text 
                              }}
                            >
                              {isCurrentUser ? 'You' : (msg.username || 'Unknown user')}
                            </span>
                            <span 
                              className={styles.timestamp}
                              style={{ color: colors.textSecondary }}
                            >
                              {formatTimestamp(msg.created_at)}
                            </span>
                          </div>
                        )}
                        
                        <div 
                          className={`${styles.messageBubble} ${isCurrentUser ? styles.currentUserBubble : ''}`}
                          style={{ 
                            backgroundColor: isCurrentUser ? colors.primary : colors.background,
                            color: isCurrentUser ? '#FFFFFF' : colors.text
                          }}
                        >
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          
          <div 
            className={styles.inputContainer}
            style={{ borderTopColor: colors.border }}
          >
            <div 
              className={styles.inputWrapper}
              style={{ 
                backgroundColor: colors.background,
                borderColor: colors.border
              }}
            >
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type a message..."
                className={styles.messageInput}
                style={{ color: colors.text }}
              />
            </div>
            
            <button 
              className={styles.sendButton}
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              style={{ 
                backgroundColor: colors.primary,
                opacity: !newMessage.trim() ? 0.5 : 1
              }}
            >
              <Send size={16} color="#FFFFFF" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatPanel;