import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { X, GitCommit, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { CommitInfo } from '../../services/GitService';
import styles from './CommitDetails.module.css';

interface CommitDetailsProps {
  commit: CommitInfo;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

const CommitDetails: React.FC<CommitDetailsProps> = ({
  commit,
  onClose,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext
}) => {
  const { colors } = useTheme();
  
  // Format date for display
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString(undefined, options);
  };
  
  // Extract author name and email
  const parseAuthor = (author: string) => {
    const match = author.match(/^(.+)\s+<([^>]+)>/);
    return match 
      ? { name: match[1], email: match[2] }
      : { name: author, email: '' };
  };
  
  const { name, email } = parseAuthor(commit.author);
  
  return (
    <div 
      className={styles.container}
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div 
        className={styles.header}
        style={{ borderBottomColor: colors.border }}
      >
        <div className={styles.title}>
          <GitCommit size={18} color={colors.primary} />
          <h3 style={{ color: colors.text }}>Commit Details</h3>
        </div>
        
        <button 
          className={styles.closeButton}
          onClick={onClose}
        >
          <X size={18} color={colors.textSecondary} />
        </button>
      </div>
      
      <div className={styles.content}>
        <div className={styles.commitSummary}>
          <div 
            className={styles.commitMessage}
            style={{ color: colors.text }}
          >
            {commit.message}
          </div>
          
          <div className={styles.commitMeta}>
            <div 
              className={styles.commitHash}
              style={{ color: colors.textSecondary }}
            >
              {commit.shortHash}
            </div>
            
            {commit.branch && (
              <div 
                className={styles.commitBranch}
                style={{ 
                  backgroundColor: `${colors.primary}30`,
                  color: colors.primary
                }}
              >
                {commit.branch}
              </div>
            )}
          </div>
        </div>
        
        <div className={styles.divider} style={{ backgroundColor: colors.border }}></div>
        
        <div className={styles.detailsGrid}>
          <div className={styles.detailLabel} style={{ color: colors.textSecondary }}>
            Author
          </div>
          <div className={styles.detailValue} style={{ color: colors.text }}>
            {name} {email && <span className={styles.email}>({email})</span>}
          </div>
          
          <div className={styles.detailLabel} style={{ color: colors.textSecondary }}>
            Date
          </div>
          <div 
            className={styles.detailValue}
            style={{ color: colors.text }}
          >
            <Clock size={14} className={styles.detailIcon} />
            {formatDate(commit.date)}
          </div>
          
          <div className={styles.detailLabel} style={{ color: colors.textSecondary }}>
            Commit
          </div>
          <div 
            className={styles.detailValue}
            style={{ color: colors.text, fontFamily: 'Fira Code, monospace' }}
          >
            {commit.hash}
          </div>
        </div>
        
        {/* Change summary placeholder - in a real implementation, this would show actual diffs */}
        <div className={styles.changeSummary}>
          <div 
            className={styles.sectionTitle}
            style={{ color: colors.text }}
          >
            Changes
          </div>
          <div 
            className={styles.diffPlaceholder}
            style={{ 
              backgroundColor: colors.background,
              borderColor: colors.border
            }}
          >
            <pre style={{ color: colors.textSecondary, margin: 0 }}>
              {/* This would typically show actual diff content */}
              Diff content would appear here
              
              For a real implementation, this would show:
              - Changed files
              - Line-by-line diffs with additions/deletions
              - Stats (# of files changed, lines added/removed)
            </pre>
          </div>
        </div>
      </div>
      
      <div 
        className={styles.footer}
        style={{ borderTopColor: colors.border }}
      >
        <button
          className={`${styles.navButton} ${!hasPrevious ? styles.disabled : ''}`}
          onClick={onPrevious}
          disabled={!hasPrevious}
          title="Previous commit"
          style={{ opacity: hasPrevious ? 1 : 0.5 }}
        >
          <ChevronLeft size={16} color={colors.textSecondary} />
          <span style={{ color: colors.text }}>Previous</span>
        </button>
        
        <button
          className={`${styles.navButton} ${!hasNext ? styles.disabled : ''}`}
          onClick={onNext}
          disabled={!hasNext}
          title="Next commit"
          style={{ opacity: hasNext ? 1 : 0.5 }}
        >
          <span style={{ color: colors.text }}>Next</span>
          <ChevronRight size={16} color={colors.textSecondary} />
        </button>
      </div>
    </div>
  );
};

export default CommitDetails;