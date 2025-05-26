import React, { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import CodeIntelligenceService from '../../services/CodeIntelligence';
import styles from './CodeValidation.module.css';

interface Diagnostic {
  message: string;
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
}

interface CodeValidationProps {
  code: string;
  language: string;
}

const CodeValidation: React.FC<CodeValidationProps> = ({ code, language }) => {
  const { colors } = useTheme();
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  
  // Run linting when code changes, but with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      const results = CodeIntelligenceService.getLintDiagnostics(code, language);
      setDiagnostics(results);
    }, 500); // 500ms debounce
    
    return () => clearTimeout(timer);
  }, [code, language]);
  
  // Count diagnostics by severity
  const errorCount = diagnostics.filter(d => d.severity === 'error').length;
  const warningCount = diagnostics.filter(d => d.severity === 'warning').length;
  const infoCount = diagnostics.filter(d => d.severity === 'info').length;
  
  // Don't render anything if there are no diagnostics
  if (diagnostics.length === 0) return null;
  
  return (
    <div 
      className={styles.container}
      style={{ borderTopColor: colors.border }}
    >
      <div className={styles.summary}>
        {errorCount > 0 && (
          <div 
            className={styles.badge}
            style={{ backgroundColor: colors.error }}
          >
            {errorCount} {errorCount === 1 ? 'error' : 'errors'}
          </div>
        )}
        
        {warningCount > 0 && (
          <div 
            className={styles.badge}
            style={{ backgroundColor: colors.warning }}
          >
            {warningCount} {warningCount === 1 ? 'warning' : 'warnings'}
          </div>
        )}
        
        {infoCount > 0 && (
          <div 
            className={styles.badge}
            style={{ backgroundColor: colors.primary }}
          >
            {infoCount} {infoCount === 1 ? 'suggestion' : 'suggestions'}
          </div>
        )}
      </div>
      
      <div className={styles.list}>
        {diagnostics.map((diagnostic, index) => (
          <div 
            key={index}
            className={styles.item}
            style={{ 
              borderLeftColor: 
                diagnostic.severity === 'error' ? colors.error :
                diagnostic.severity === 'warning' ? colors.warning : 
                colors.primary 
            }}
          >
            <div className={styles.location}>
              Line {diagnostic.line}, Column {diagnostic.column}
            </div>
            <div className={styles.message}>
              {diagnostic.message}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CodeValidation;