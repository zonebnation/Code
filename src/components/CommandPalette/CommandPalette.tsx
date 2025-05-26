import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import CommandService, { Command } from '../../services/CommandService';
import { X, Search, Keyboard } from 'lucide-react';
import KeyboardShortcutsHelp from '../Help/KeyboardShortcutsHelp';
import styles from './CommandPalette.module.css';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [commands, setCommands] = useState<Command[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const commandsContainerRef = useRef<HTMLDivElement>(null);
  
  // Load commands and focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setCommands(CommandService.getAllCommands());
      setSelectedIndex(0);
      
      // Focus the input when the palette opens
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 10);
    }
  }, [isOpen]);
  
  // Handle query changes
  useEffect(() => {
    setCommands(CommandService.searchCommands(query));
    setSelectedIndex(0);
  }, [query]);
  
  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < commands.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (commands[selectedIndex]) {
          executeCommand(commands[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      case 'k':
        // Show keyboard shortcuts help with Ctrl+K
        if (e.ctrlKey) {
          e.preventDefault();
          onClose();
          setShowKeyboardHelp(true);
        }
        break;
    }
  };
  
  // Scroll selected item into view
  useEffect(() => {
    if (commandsContainerRef.current && commands.length > 0) {
      const selectedElement = commandsContainerRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);
  
  const executeCommand = (command: Command) => {
    CommandService.executeCommand(command.id);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <>
      <div 
        className={styles.overlay}
        onClick={onClose}
      >
        <div 
          className={styles.palette}
          onClick={e => e.stopPropagation()}
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        >
          <div className={styles.searchContainer}>
            <Search size={16} color={colors.textSecondary} className={styles.searchIcon} />
            <input
              ref={inputRef}
              className={styles.searchInput}
              style={{ color: colors.text }}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type to search commands..."
            />
            <div className={styles.searchActions}>
              <button 
                className={styles.searchAction}
                onClick={() => {
                  onClose();
                  setShowKeyboardHelp(true);
                }}
                title="Keyboard Shortcuts (Ctrl+K)"
              >
                <Keyboard size={16} color={colors.textSecondary} />
              </button>
              
              <button 
                className={styles.closeButton}
                onClick={onClose}
              >
                <X size={16} color={colors.textSecondary} />
              </button>
            </div>
          </div>
          
          <div 
            ref={commandsContainerRef}
            className={styles.commandsContainer}
          >
            {commands.length === 0 ? (
              <div 
                className={styles.noResults}
                style={{ color: colors.textSecondary }}
              >
                No commands found
              </div>
            ) : (
              commands.map((command, index) => (
                <div
                  key={command.id}
                  className={`${styles.commandItem} ${index === selectedIndex ? styles.selected : ''}`}
                  style={{ 
                    backgroundColor: index === selectedIndex ? colors.selectedItem : 'transparent',
                  }}
                  onClick={() => executeCommand(command)}
                  data-index={index}
                >
                  <div className={styles.commandTitle} style={{ color: colors.text }}>
                    {command.title}
                  </div>
                  <div className={styles.commandMeta}>
                    <span 
                      className={styles.commandCategory} 
                      style={{ color: colors.textSecondary }}
                    >
                      {command.category}
                    </span>
                    {command.shortcut && (
                      <span 
                        className={styles.commandShortcut}
                        style={{ color: colors.primary }}
                      >
                        {command.shortcut}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Render keyboard shortcuts help if needed */}
      {showKeyboardHelp && (
        <KeyboardShortcutsHelp onClose={() => setShowKeyboardHelp(false)} />
      )}
    </>
  );
};

export default CommandPalette;