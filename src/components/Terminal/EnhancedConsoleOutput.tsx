import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { ChevronsDown, Trash } from 'lucide-react';
import styles from './EnhancedConsoleOutput.module.css';

interface ConsoleMessage {
  id: string;
  type: 'log' | 'error' | 'warn' | 'info' | 'system';
  content: string;
  timestamp: number;
}

interface EnhancedConsoleOutputProps {
  messages: ConsoleMessage[];
  onClear: () => void;
  height?: number;
  className?: string;
}

const EnhancedConsoleOutput: React.FC<EnhancedConsoleOutputProps> = ({ 
  messages, 
  onClear, 
  height = 200,
  className = ''
}) => {
  const { colors } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  
  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };
  
  // Get message style based on message type
  const getMessageStyle = (type: string) => {
    switch (type) {
      case 'error':
        return { color: colors.error };
      case 'warn':
        return { color: colors.warning };
      case 'info':
        return { color: colors.primary };
      case 'system':
        return { color: colors.textSecondary, fontStyle: 'italic' };
      default:
        return { color: colors.text };
    }
  };
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (containerRef.current && autoScroll) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);
  
  // Detect when user scrolls up
  const handleScroll = () => {
    if (!containerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
    
    setAutoScroll(isAtBottom);
    setShowScrollToBottom(!isAtBottom && messages.length > 0);
  };
  
  // Scroll to bottom
  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      setAutoScroll(true);
      setShowScrollToBottom(false);
    }
  };
  
  return (
    <div 
      className={`${styles.container} ${className}`}
      style={{ 
        backgroundColor: colors.surface,
        borderColor: colors.border,
        height
      }}
    >
      <div className={styles.toolbar}>
        <span className={styles.title} style={{ color: colors.textSecondary }}>
          Console Output
        </span>
        <div className={styles.actions}>
          <button 
            className={styles.actionButton}
            onClick={onClear}
            title="Clear console"
          >
            <Trash size={14} color={colors.textSecondary} />
          </button>
        </div>
      </div>
      
      <div 
        className={styles.messagesContainer}
        ref={containerRef}
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <div className={styles.emptyState} style={{ color: colors.textSecondary }}>
            Console output will appear here
          </div>
        ) : (
          messages.map(message => (
            <div key={message.id} className={styles.message}>
              <span className={styles.timestamp} style={{ color: colors.textSecondary }}>
                {formatTime(message.timestamp)}
              </span>
              <pre 
                className={styles.content}
                style={getMessageStyle(message.type)}
              >
                {message.content}
              </pre>
            </div>
          ))
        )}
      </div>
      
      {showScrollToBottom && (
        <button 
          className={styles.scrollToBottomButton}
          style={{ 
            backgroundColor: colors.primary,
            color: '#FFFFFF'
          }}
          onClick={scrollToBottom}
        >
          <ChevronsDown size={14} color="#FFFFFF" />
          <span>New messages</span>
        </button>
      )}
    </div>
  );
};

export default EnhancedConsoleOutput;