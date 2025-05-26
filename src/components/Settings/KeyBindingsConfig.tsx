import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import keyBindingsService, { KeyBinding, KeyCombo } from '../../services/KeyBindingsService';
import { Search, X, RotateCcw, Plus, Keyboard, Check } from 'lucide-react';

const KeyBindingsConfig: React.FC = () => {
  const { colors } = useTheme();
  const [bindings, setBindings] = useState<KeyBinding[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingBindingId, setEditingBindingId] = useState<string | null>(null);
  const [recordingKeys, setRecordingKeys] = useState(false);
  const [currentKeyCombo, setCurrentKeyCombo] = useState<KeyCombo | null>(null);
  const configRef = useRef<HTMLDivElement>(null);
  
  // Load bindings when the component mounts
  useEffect(() => {
    const allBindings = keyBindingsService.getAllBindings();
    setBindings(allBindings);
  }, []);
  
  // Filter bindings based on search query
  const filteredBindings = bindings.filter(binding => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      binding.action.toLowerCase().includes(query) ||
      binding.category.toLowerCase().includes(query) ||
      binding.description.toLowerCase().includes(query) ||
      keyBindingsService.formatKeyCombo(binding.currentKeyCombo).toLowerCase().includes(query)
    );
  });
  
  // Group bindings by category for display
  const groupedBindings = filteredBindings.reduce((acc, binding) => {
    if (!acc[binding.category]) {
      acc[binding.category] = [];
    }
    acc[binding.category].push(binding);
    return acc;
  }, {} as Record<string, KeyBinding[]>);
  
  // Sort categories alphabetically
  const sortedCategories = Object.keys(groupedBindings).sort();
  
  // Handle starting to record a new key combination
  const startRecordingKeys = (bindingId: string) => {
    setEditingBindingId(bindingId);
    setRecordingKeys(true);
    setCurrentKeyCombo(null);
    
    // Focus the config container to capture key events
    if (configRef.current) {
      configRef.current.focus();
    }
  };
  
  // Handle key down event when recording
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!recordingKeys) return;
    
    // Prevent default behavior
    e.preventDefault();
    
    // Skip modifier-only key presses
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
      return;
    }
    
    // Create key combo object
    const newKeyCombo: KeyCombo = {
      key: e.key,
      ctrl: e.ctrlKey,
      alt: e.altKey,
      shift: e.shiftKey,
      meta: e.metaKey
    };
    
    setCurrentKeyCombo(newKeyCombo);
  };
  
  // Save the new key binding
  const saveKeyBinding = () => {
    if (!editingBindingId || !currentKeyCombo) return;
    
    keyBindingsService.updateBinding(editingBindingId, currentKeyCombo);
    
    // Refresh bindings
    setBindings(keyBindingsService.getAllBindings());
    
    // Reset editing state
    setEditingBindingId(null);
    setRecordingKeys(false);
    setCurrentKeyCombo(null);
  };
  
  // Cancel recording
  const cancelRecording = () => {
    setEditingBindingId(null);
    setRecordingKeys(false);
    setCurrentKeyCombo(null);
  };
  
  // Reset a specific binding to its default
  const resetBinding = (bindingId: string) => {
    keyBindingsService.resetBinding(bindingId);
    setBindings(keyBindingsService.getAllBindings());
  };
  
  // Reset all bindings to their defaults
  const resetAllBindings = () => {
    if (window.confirm('Are you sure you want to reset all keyboard shortcuts to their default values?')) {
      keyBindingsService.resetAllBindings();
      setBindings(keyBindingsService.getAllBindings());
    }
  };

  return (
    <div 
      ref={configRef}
      tabIndex={-1} // Make div focusable
      onKeyDown={handleKeyDown}
      style={{ outline: 'none', padding: '16px' }} // Hide the focus outline
    >
      {/* Header with search and reset button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Keyboard size={22} color={colors.primary} />
          <h2 style={{ 
            margin: 0, 
            color: colors.text, 
            fontSize: '20px' 
          }}>
            Keyboard Shortcuts
          </h2>
        </div>
        
        <button
          onClick={resetAllBindings}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            backgroundColor: 'transparent',
            color: colors.error,
            border: `1px solid ${colors.error}`,
            borderRadius: '4px',
            cursor: 'pointer',
            minHeight: '36px'
          }}
        >
          <RotateCcw size={14} />
          Reset All
        </button>
      </div>
      
      {/* Search input */}
      <div style={{
        position: 'relative',
        marginBottom: '24px'
      }}>
        <Search 
          size={16} 
          style={{ 
            position: 'absolute', 
            left: '12px', 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: colors.textSecondary
          }} 
        />
        
        <input
          type="text"
          placeholder="Search shortcuts..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 36px 10px 36px',
            fontSize: '14px',
            borderRadius: '4px',
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.surface,
            color: colors.text,
            minHeight: '36px'
          }}
        />
        
        {searchQuery && (
          <X 
            size={16} 
            style={{ 
              position: 'absolute', 
              right: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: colors.textSecondary,
              cursor: 'pointer'
            }}
            onClick={() => setSearchQuery('')}
          />
        )}
      </div>
      
      {/* Keyboard shortcuts by category */}
      {sortedCategories.length === 0 ? (
        <div style={{
          padding: '48px 0',
          textAlign: 'center',
          color: colors.textSecondary
        }}>
          {searchQuery ? 'No shortcuts match your search' : 'No shortcuts found'}
        </div>
      ) : (
        sortedCategories.map(category => (
          <div key={category} style={{ marginBottom: '32px' }}>
            <h3 style={{ 
              color: colors.primary, 
              fontSize: '16px', 
              marginBottom: '12px',
              paddingBottom: '4px',
              borderBottom: `1px solid ${colors.border}` 
            }}>
              {category}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {groupedBindings[category].map(binding => (
                <div 
                  key={binding.id} 
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    backgroundColor: colors.surface,
                    borderRadius: '6px',
                    border: `1px solid ${colors.border}`
                  }}
                >
                  <div>
                    <div style={{ color: colors.text, fontWeight: 500, marginBottom: '2px' }}>
                      {binding.action}
                    </div>
                    <div style={{ color: colors.textSecondary, fontSize: '13px' }}>
                      {binding.description}
                    </div>
                  </div>
                  
                  {editingBindingId === binding.id ? (
                    // Editing mode
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        padding: '6px 12px',
                        backgroundColor: recordingKeys ? `${colors.primary}20` : colors.background,
                        border: `1px solid ${recordingKeys ? colors.primary : colors.border}`,
                        borderRadius: '4px',
                        color: colors.text,
                        fontFamily: 'monospace',
                        minWidth: '120px',
                        textAlign: 'center',
                        minHeight: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {currentKeyCombo 
                          ? keyBindingsService.formatKeyCombo(currentKeyCombo) 
                          : 'Type shortcut...'}
                      </div>
                      
                      {currentKeyCombo && (
                        <button
                          onClick={saveKeyBinding}
                          style={{
                            padding: '6px',
                            backgroundColor: colors.success,
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: '36px',
                            minWidth: '36px'
                          }}
                        >
                          <Check size={16} />
                        </button>
                      )}
                      
                      <button
                        onClick={cancelRecording}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: 'transparent',
                          color: colors.error,
                          border: `1px solid ${colors.error}`,
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          minHeight: '36px'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    // Display mode
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        padding: '6px 12px',
                        backgroundColor: colors.background,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '4px',
                        color: colors.text,
                        fontFamily: 'monospace',
                        fontSize: '13px',
                        minHeight: '36px',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        {keyBindingsService.formatKeyCombo(binding.currentKeyCombo)}
                      </div>
                      
                      <button
                        onClick={() => startRecordingKeys(binding.id)}
                        style={{
                          padding: '6px 10px',
                          backgroundColor: colors.primary,
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          minHeight: '36px'
                        }}
                      >
                        Edit
                      </button>
                      
                      <button
                        onClick={() => resetBinding(binding.id)}
                        style={{
                          padding: '6px',
                          backgroundColor: 'transparent',
                          color: colors.textSecondary,
                          border: `1px solid ${colors.border}`,
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: '36px',
                          minWidth: '36px'
                        }}
                      >
                        <RotateCcw size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default KeyBindingsConfig;