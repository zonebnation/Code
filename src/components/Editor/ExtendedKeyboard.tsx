import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Undo, Redo, Save } from 'lucide-react';
import styles from './ExtendedKeyboard.module.css';

interface ExtendedKeyboardProps {
  onKeyPress: (key: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  canUndo: boolean;
  canRedo: boolean;
  tabSize: number;
  useTabs: boolean;
}

const ExtendedKeyboard: React.FC<ExtendedKeyboardProps> = ({
  onKeyPress,
  onUndo,
  onRedo,
  onSave,
  canUndo,
  canRedo,
  tabSize = 2,
  useTabs = false
}) => {
  const { colors } = useTheme();
  
  // Common programming symbols
  const symbols = [
    '(', ')', '{', '}', '[', ']', '<', '>', '/', '\\', '|',
    '&', '!', '.', ',', ';', ':', "'", '"', '_', '-', '+',
    '=', '*', '%', '$', '#', '@', '~', '`'
  ];

  const handleTabPress = () => {
    if (useTabs) {
      onKeyPress('\t');
    } else {
      // Insert spaces based on tab size
      onKeyPress(' '.repeat(tabSize));
    }
  };

  return (
    <div 
      className={styles.container}
      style={{ backgroundColor: colors.surface, borderTopColor: colors.border }}
    >
      <div className={styles.historyButtons}>
        <button
          className={styles.historyButton}
          style={{ opacity: canUndo ? 1 : 0.5 }}
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <Undo size={20} color={colors.text} />
        </button>
        <button
          className={styles.historyButton}
          style={{ opacity: canRedo ? 1 : 0.5 }}
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          <Redo size={20} color={colors.text} />
        </button>
        <button
          className={styles.historyButton}
          onClick={onSave}
          title="Save (Ctrl+S)"
        >
          <Save size={20} color={colors.text} />
        </button>
      </div>
      
      <div className={styles.keysContainer}>
        <button
          className={styles.tabKey}
          style={{ backgroundColor: colors.primary, color: '#FFFFFF' }}
          onClick={handleTabPress}
        >
          Tab
        </button>
        
        {symbols.map((symbol, index) => (
          <button
            key={index}
            className={styles.key}
            style={{ backgroundColor: colors.background, color: colors.text }}
            onClick={() => onKeyPress(symbol)}
          >
            {symbol}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ExtendedKeyboard;