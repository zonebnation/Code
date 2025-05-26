import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import keyBindingsService, { KeyBinding } from '../../services/KeyBindingsService';
import { X, Search, Keyboard } from 'lucide-react';

interface KeyboardShortcutsHelpProps {
  onClose: () => void;
}

const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({ onClose }) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeScope, setActiveScope] = useState<string>('all');
  
  // Get all bindings
  const allBindings = keyBindingsService.getAllBindings();
  
  // Filter bindings by scope and search query
  const filteredBindings = allBindings.filter(binding => {
    // Filter by scope
    if (activeScope !== 'all' && binding.scope !== activeScope) {
      return false;
    }
    
    // Filter by search query
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      binding.action.toLowerCase().includes(query) ||
      binding.category.toLowerCase().includes(query) ||
      binding.description.toLowerCase().includes(query) ||
      keyBindingsService.formatKeyCombo(binding.currentKeyCombo).toLowerCase().includes(query)
    );
  });
  
  // Group bindings by category
  const groupedBindings = filteredBindings.reduce((acc, binding) => {
    if (!acc[binding.category]) {
      acc[binding.category] = [];
    }
    acc[binding.category].push(binding);
    return acc;
  }, {} as Record<string, KeyBinding[]>);
  
  // Sort categories alphabetically
  const sortedCategories = Object.keys(groupedBindings).sort();
  
  // Available scopes
  const scopes = [
    { id: 'all', label: 'All Shortcuts' },
    { id: 'global', label: 'Global' },
    { id: 'editor', label: 'Editor' },
    { id: 'terminal', label: 'Terminal' },
    { id: 'explorer', label: 'Explorer' }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: colors.surface,
        borderRadius: '8px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px' 
          }}>
            <Keyboard size={20} color={colors.primary} />
            <h2 style={{ 
              margin: 0, 
              fontSize: '18px',
              color: colors.text 
            }}>
              Keyboard Shortcuts
            </h2>
          </div>
          
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px'
            }}
            aria-label="Close"
          >
            <X size={20} color={colors.textSecondary} />
          </button>
        </div>
        
        {/* Filters */}
        <div style={{
          padding: '16px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search 
              size={16} 
              color={colors.textSecondary}
              style={{ 
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)'
              }}
            />
            <input
              type="text"
              placeholder="Search shortcuts..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '4px',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.background,
                color: colors.text,
                fontSize: '14px'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  padding: '0'
                }}
              >
                <X size={16} color={colors.textSecondary} />
              </button>
            )}
          </div>
          
          {/* Scope tabs */}
          <div style={{
            display: 'flex',
            borderBottom: `1px solid ${colors.border}`,
            marginBottom: '8px',
            paddingBottom: '4px'
          }}>
            {scopes.map(scope => (
              <button
                key={scope.id}
                onClick={() => setActiveScope(scope.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: `2px solid ${activeScope === scope.id ? colors.primary : 'transparent'}`,
                  padding: '8px 16px',
                  color: activeScope === scope.id ? colors.primary : colors.text,
                  cursor: 'pointer',
                  fontWeight: activeScope === scope.id ? 600 : 400,
                  fontSize: '14px'
                }}
              >
                {scope.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Shortcut list */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px'
        }}>
          {sortedCategories.length === 0 ? (
            <div style={{
              padding: '32px',
              textAlign: 'center',
              color: colors.textSecondary
            }}>
              No shortcuts found
            </div>
          ) : (
            sortedCategories.map(category => (
              <div key={category} style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: '16px',
                  color: colors.primary,
                  marginBottom: '12px',
                  paddingBottom: '4px',
                  borderBottom: `1px solid ${colors.border}`
                }}>
                  {category}
                </h3>
                
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse'
                }}>
                  <tbody>
                    {groupedBindings[category].map(binding => (
                      <tr key={binding.id} style={{
                        borderBottom: `1px solid ${colors.border}80`
                      }}>
                        <td style={{
                          padding: '8px 16px 8px 8px',
                          color: colors.text,
                          width: '40%'
                        }}>
                          {binding.action}
                        </td>
                        <td style={{
                          padding: '8px',
                          color: colors.textSecondary,
                          fontSize: '13px',
                          width: '40%'
                        }}>
                          {binding.description}
                        </td>
                        <td style={{
                          padding: '8px 8px 8px 16px',
                          textAlign: 'right',
                          width: '20%'
                        }}>
                          <code style={{
                            display: 'inline-block',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: `${colors.primary}15`,
                            color: colors.primary,
                            fontFamily: 'monospace',
                            fontSize: '12px'
                          }}>
                            {keyBindingsService.formatKeyCombo(binding.currentKeyCombo)}
                          </code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
        
        {/* Footer */}
        <div style={{
          padding: '12px 16px',
          borderTop: `1px solid ${colors.border}`,
          textAlign: 'center',
          color: colors.textSecondary,
          fontSize: '13px'
        }}>
          Keyboard shortcuts can be customized in Settings → Keyboard
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsHelp;