import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { AlertTriangle, Info, Check } from 'lucide-react';

interface LinterConfigProps {
  onApply: (config: Record<string, boolean>) => void;
  defaultConfig?: Record<string, boolean>;
}

const LinterConfig: React.FC<LinterConfigProps> = ({ 
  onApply, 
  defaultConfig = {
    'no-console': true,
    'no-var': true,
    'prefer-const': true,
    'eqeqeq': true,
    'semi': true,
    'jsx-a11y': true,
    'no-unused-vars': true
  }
}) => {
  const { colors } = useTheme();
  const [config, setConfig] = useState(defaultConfig);

  const toggleRule = (ruleId: string) => {
    setConfig(prev => ({
      ...prev,
      [ruleId]: !prev[ruleId]
    }));
  };

  const rules = [
    {
      id: 'no-console',
      name: 'No console.log',
      description: 'Disallow console.log statements',
      severity: 'warning'
    },
    {
      id: 'no-var',
      name: 'No var',
      description: 'Use let or const instead of var',
      severity: 'warning'
    },
    {
      id: 'prefer-const',
      name: 'Prefer const',
      description: 'Use const for variables that are never reassigned',
      severity: 'info'
    },
    {
      id: 'eqeqeq',
      name: 'Triple equals',
      description: 'Require === and !== instead of == and !=',
      severity: 'warning'
    },
    {
      id: 'semi',
      name: 'Semicolons',
      description: 'Require semicolons at the end of statements',
      severity: 'warning'
    },
    {
      id: 'jsx-a11y',
      name: 'Accessibility',
      description: 'Enforce accessibility best practices',
      severity: 'warning'
    },
    {
      id: 'no-unused-vars',
      name: 'No unused variables',
      description: 'Disallow unused variables',
      severity: 'warning'
    }
  ];

  const handleSaveConfig = () => {
    onApply(config);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertTriangle size={16} color={colors.error} />;
      case 'warning':
        return <AlertTriangle size={16} color={colors.warning} />;
      case 'info':
        return <Info size={16} color={colors.primary} />;
      default:
        return null;
    }
  };

  return (
    <div style={{
      padding: '16px',
      backgroundColor: colors.surface,
      borderRadius: '8px',
      border: `1px solid ${colors.border}`
    }}>
      <h2 style={{ 
        color: colors.text, 
        fontSize: '18px', 
        marginBottom: '16px',
        borderBottom: `1px solid ${colors.border}`,
        paddingBottom: '8px'
      }}>
        Linter Configuration
      </h2>
      
      <div>
        {rules.map(rule => (
          <div
            key={rule.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              padding: '8px 12px',
              borderRadius: '4px',
              backgroundColor: `${colors.background}50`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {getSeverityIcon(rule.severity)}
              <div>
                <div style={{ color: colors.text, fontWeight: 500 }}>{rule.name}</div>
                <div style={{ color: colors.textSecondary, fontSize: '12px' }}>{rule.description}</div>
              </div>
            </div>
            
            <label style={{
              position: 'relative',
              display: 'inline-block',
              width: '36px',
              height: '20px'
            }}>
              <input
                type="checkbox"
                checked={config[rule.id]}
                onChange={() => toggleRule(rule.id)}
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
                backgroundColor: config[rule.id] ? colors.primary : colors.border,
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
                  transform: config[rule.id] ? 'translateX(16px)' : 'translateX(0)'
                }}></span>
              </span>
            </label>
          </div>
        ))}
      </div>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end',
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: `1px solid ${colors.border}`
      }}>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: colors.primary,
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 16px',
            cursor: 'pointer'
          }}
          onClick={handleSaveConfig}
        >
          <Check size={16} />
          Apply Configuration
        </button>
      </div>
    </div>
  );
};

export default LinterConfig;