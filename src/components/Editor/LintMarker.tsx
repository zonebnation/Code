import React from 'react';
import { LintIssue } from '../../services/LinterService';

interface LintMarkerProps {
  issue: LintIssue;
  onMouseEnter?: (issue: LintIssue) => void;
  onMouseLeave?: () => void;
  onClick?: (issue: LintIssue) => void;
}

const LintMarker: React.FC<LintMarkerProps> = ({ 
  issue,
  onMouseEnter,
  onMouseLeave,
  onClick
}) => {
  const getColor = () => {
    switch (issue.severity) {
      case 'error':
        return '#f56c6c';
      case 'warning':
        return '#e6a23c';
      case 'info':
        return '#409eff';
      default:
        return '#909399';
    }
  };

  return (
    <div
      style={{
        display: 'inline-block',
        position: 'relative',
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: getColor(),
        marginRight: '5px',
        cursor: 'pointer',
      }}
      onMouseEnter={() => onMouseEnter?.(issue)}
      onMouseLeave={onMouseLeave}
      onClick={() => onClick?.(issue)}
      title={issue.message}
    />
  );
};

export default LintMarker;