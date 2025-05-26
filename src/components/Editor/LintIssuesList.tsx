import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { LintIssue } from '../../services/LinterService';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface LintIssuesListProps {
  issues: LintIssue[];
  onIssueClick?: (issue: LintIssue) => void;
}

const LintIssuesList: React.FC<LintIssuesListProps> = ({ issues, onIssueClick }) => {
  const { colors } = useTheme();

  const getIconForSeverity = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertCircle size={14} color={colors.error} />;
      case 'warning':
        return <AlertTriangle size={14} color={colors.warning} />;
      case 'info':
        return <Info size={14} color={colors.primary} />;
      default:
        return null;
    }
  };

  const getColorForSeverity = (severity: string) => {
    switch (severity) {
      case 'error':
        return colors.error;
      case 'warning':
        return colors.warning;
      case 'info':
        return colors.primary;
      default:
        return colors.text;
    }
  };

  // Group issues by file
  const groupedIssues: { [key: string]: LintIssue[] } = {};
  issues.forEach(issue => {
    const location = `Line ${issue.line}, Column ${issue.column}`;
    if (!groupedIssues[location]) {
      groupedIssues[location] = [];
    }
    groupedIssues[location].push(issue);
  });

  return (
    <div
      style={{
        maxHeight: '300px',
        overflowY: 'auto',
        padding: '8px',
        backgroundColor: colors.surface,
        borderRadius: '4px',
        border: `1px solid ${colors.border}`,
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '8px',
        borderBottom: `1px solid ${colors.border}`,
        paddingBottom: '8px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: colors.text }}>
          Problems
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: colors.error }}>
            <AlertCircle size={12} />
            {issues.filter(i => i.severity === 'error').length} Errors
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: colors.warning }}>
            <AlertTriangle size={12} />
            {issues.filter(i => i.severity === 'warning').length} Warnings
          </span>
        </div>
      </div>

      {Object.keys(groupedIssues).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '16px', color: colors.textSecondary }}>
          No problems found
        </div>
      ) : (
        Object.entries(groupedIssues).map(([location, issues]) => (
          <div key={location} style={{ marginBottom: '8px' }}>
            <div style={{ 
              fontSize: '12px', 
              color: colors.textSecondary, 
              marginBottom: '4px', 
              fontFamily: 'monospace' 
            }}>
              {location}
            </div>
            {issues.map((issue, index) => (
              <div 
                key={index} 
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: `${getColorForSeverity(issue.severity)}10`,
                  marginBottom: '4px',
                  cursor: 'pointer',
                }}
                onClick={() => onIssueClick?.(issue)}
              >
                {getIconForSeverity(issue.severity)}
                <div style={{ color: colors.text, fontSize: '13px' }}>
                  {issue.message}
                  {issue.ruleId && (
                    <span style={{ 
                      color: colors.textSecondary, 
                      fontSize: '11px', 
                      marginLeft: '4px' 
                    }}>
                      ({issue.ruleId})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
};

export default LintIssuesList;