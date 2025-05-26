import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';
import { Code, AlignJustify, Indent, Map, Zap } from 'lucide-react';
import FontSizePicker from './FontSizePicker';
import TabSizePicker from './TabSizePicker';
import ThemePicker from './ThemePicker';

const EditorSettings: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { 
    editorSettings, 
    updateFontSize,
    updateTabSize,
    updateUseTabs,
    updateWordWrap,
    updateAutoSave,
    updateMinimapEnabled,
    colorTheme,
    updateColorTheme
  } = useSettings();

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ 
        marginBottom: '24px', 
        backgroundColor: colors.surface,
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        {/* Word Wrap Toggle */}
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: `1px solid ${colors.border}`
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <AlignJustify size={20} color={colors.primary} style={{ marginRight: '12px' }} />
            <span style={{ color: colors.text, fontSize: '16px' }}>
              Word Wrap
            </span>
          </div>
          
          <label style={{
            position: 'relative',
            display: 'inline-block',
            width: '36px',
            height: '20px'
          }}>
            <input
              type="checkbox"
              checked={editorSettings.wordWrap}
              onChange={(e) => updateWordWrap(e.target.checked)}
              style={{
                opacity: 0,
                width: 0,
                height: 0
              }}
            />
            <span style={{
              position: 'absolute',
              cursor: 'pointer',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: editorSettings.wordWrap ? colors.primary : colors.border,
              borderRadius: '10px',
              transition: '.4s',
            }}>
              <span style={{
                position: 'absolute',
                content: '""',
                height: '16px',
                width: '16px',
                left: '2px',
                bottom: '2px',
                backgroundColor: 'white',
                borderRadius: '50%',
                transition: '.4s',
                transform: editorSettings.wordWrap ? 'translateX(16px)' : 'translateX(0)'
              }}></span>
            </span>
          </label>
        </div>
        
        {/* Auto Save Toggle */}
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: `1px solid ${colors.border}`
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Zap size={20} color={colors.primary} style={{ marginRight: '12px' }} />
            <span style={{ color: colors.text, fontSize: '16px' }}>
              Auto Save
            </span>
          </div>
          
          <label style={{
            position: 'relative',
            display: 'inline-block',
            width: '36px',
            height: '20px'
          }}>
            <input
              type="checkbox"
              checked={editorSettings.autoSave}
              onChange={(e) => updateAutoSave(e.target.checked)}
              style={{
                opacity: 0,
                width: 0,
                height: 0
              }}
            />
            <span style={{
              position: 'absolute',
              cursor: 'pointer',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: editorSettings.autoSave ? colors.primary : colors.border,
              borderRadius: '10px',
              transition: '.4s',
            }}>
              <span style={{
                position: 'absolute',
                content: '""',
                height: '16px',
                width: '16px',
                left: '2px',
                bottom: '2px',
                backgroundColor: 'white',
                borderRadius: '50%',
                transition: '.4s',
                transform: editorSettings.autoSave ? 'translateX(16px)' : 'translateX(0)'
              }}></span>
            </span>
          </label>
        </div>
        
        {/* Minimap Toggle */}
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: `1px solid ${colors.border}`
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Map size={20} color={colors.primary} style={{ marginRight: '12px' }} />
            <span style={{ color: colors.text, fontSize: '16px' }}>
              Show Minimap
            </span>
          </div>
          
          <label style={{
            position: 'relative',
            display: 'inline-block',
            width: '36px',
            height: '20px'
          }}>
            <input
              type="checkbox"
              checked={editorSettings.minimapEnabled}
              onChange={(e) => updateMinimapEnabled(e.target.checked)}
              style={{
                opacity: 0,
                width: 0,
                height: 0
              }}
            />
            <span style={{
              position: 'absolute',
              cursor: 'pointer',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: editorSettings.minimapEnabled ? colors.primary : colors.border,
              borderRadius: '10px',
              transition: '.4s',
            }}>
              <span style={{
                position: 'absolute',
                content: '""',
                height: '16px',
                width: '16px',
                left: '2px',
                bottom: '2px',
                backgroundColor: 'white',
                borderRadius: '50%',
                transition: '.4s',
                transform: editorSettings.minimapEnabled ? 'translateX(16px)' : 'translateX(0)'
              }}></span>
            </span>
          </label>
        </div>
        
        {/* Use Tabs or Spaces */}
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: `1px solid ${colors.border}`
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Code size={20} color={colors.primary} style={{ marginRight: '12px' }} />
            <span style={{ color: colors.text, fontSize: '16px' }}>
              Insert Spaces
            </span>
          </div>
          
          <label style={{
            position: 'relative',
            display: 'inline-block',
            width: '36px',
            height: '20px'
          }}>
            <input
              type="checkbox"
              checked={!editorSettings.useTabs}
              onChange={(e) => updateUseTabs(!e.target.checked)}
              style={{
                opacity: 0,
                width: 0,
                height: 0
              }}
            />
            <span style={{
              position: 'absolute',
              cursor: 'pointer',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: !editorSettings.useTabs ? colors.primary : colors.border,
              borderRadius: '10px',
              transition: '.4s',
            }}>
              <span style={{
                position: 'absolute',
                content: '""',
                height: '16px',
                width: '16px',
                left: '2px',
                bottom: '2px',
                backgroundColor: 'white',
                borderRadius: '50%',
                transition: '.4s',
                transform: !editorSettings.useTabs ? 'translateX(16px)' : 'translateX(0)'
              }}></span>
            </span>
          </label>
        </div>
        
        {/* Font Size Picker */}
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: `1px solid ${colors.border}`
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <AlignJustify size={20} color={colors.primary} style={{ marginRight: '12px' }} />
            <span style={{ color: colors.text, fontSize: '16px' }}>
              Font Size
            </span>
          </div>
          
          <FontSizePicker
            value={editorSettings.fontSize}
            onChange={updateFontSize}
            min={10}
            max={24}
          />
        </div>
        
        {/* Tab Size Picker */}
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: `1px solid ${colors.border}`
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Indent size={20} color={colors.primary} style={{ marginRight: '12px' }} />
            <span style={{ color: colors.text, fontSize: '16px' }}>
              Tab Size
            </span>
          </div>
          
          <TabSizePicker 
            value={editorSettings.tabSize}
            onChange={updateTabSize}
          />
        </div>
        
        {/* Theme Picker */}
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '12px 16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Code size={20} color={colors.primary} style={{ marginRight: '12px' }} />
            <span style={{ color: colors.text, fontSize: '16px' }}>
              Editor Theme
            </span>
          </div>
          
          <ThemePicker
            value={colorTheme}
            onChange={updateColorTheme}
            isDark={isDark}
          />
        </div>
      </div>
    </div>
  );
};

export default EditorSettings;